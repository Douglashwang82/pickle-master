import { requireAuth, requireClubLeader, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";

type Params = { params: Promise<{ clubId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { clubId } = await params;

  const guardError = await requireClubLeader(clubId, auth.appUserId);
  if (guardError) return guardError;

  const now = new Date().toISOString();

  // Cancel all future published/full sessions
  const { data: futureSessions } = await supabaseAdmin
    .from("sessions")
    .select("id")
    .eq("club_id", clubId)
    .in("status", ["published", "full", "draft"])
    .gt("scheduled_start_at", now);

  if (futureSessions && futureSessions.length > 0) {
    const sessionIds = futureSessions.map((s) => s.id);

    // Mark all confirmed registrations as refund_pending
    await supabaseAdmin
      .from("session_registrations")
      .update({ status: "refund_pending", cancelled_at: now })
      .in("session_id", sessionIds)
      .eq("status", "confirmed");

    // Cancel the sessions
    await supabaseAdmin
      .from("sessions")
      .update({ status: "cancelled", cancelled_at: now, updated_at: now })
      .in("id", sessionIds);
  }

  // Dissolve the club
  const { data, error } = await supabaseAdmin
    .from("clubs")
    .update({
      status: "dissolved",
      dissolved_at: now,
      updated_at: now,
    })
    .eq("id", clubId)
    .select()
    .single();

  if (error || !data) {
    return fail("Failed to dissolve club", "DB_ERROR", 500);
  }

  return ok({ message: "Club dissolved", club: data });
}
