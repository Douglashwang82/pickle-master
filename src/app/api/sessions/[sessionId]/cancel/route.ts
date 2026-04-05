import { requireAuth, requireClubLeader, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";
import { canSessionTransition } from "@/lib/state-machines/session";
import { trackEvent } from "@/lib/analytics";
import type { SessionStatus } from "@/types/domain";

type Params = { params: Promise<{ sessionId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { sessionId } = await params;

  const { data: session } = await supabaseAdmin
    .from("sessions")
    .select("id, club_id, status")
    .eq("id", sessionId)
    .single();

  if (!session) return fail("Session not found", "NOT_FOUND", 404);

  const guardError = await requireClubLeader(session.club_id, auth.appUserId);
  if (guardError) return guardError;

  if (!canSessionTransition(session.status as SessionStatus, "cancelled")) {
    return fail(
      `Cannot cancel a session with status '${session.status}'`,
      "INVALID_TRANSITION",
      409
    );
  }

  const now = new Date().toISOString();

  // Mark all confirmed registrations as refund_pending
  const { data: confirmedRegs } = await supabaseAdmin
    .from("session_registrations")
    .select("id")
    .eq("session_id", sessionId)
    .eq("status", "confirmed");

  if (confirmedRegs && confirmedRegs.length > 0) {
    await supabaseAdmin
      .from("session_registrations")
      .update({ status: "refund_pending", cancelled_at: now })
      .in("id", confirmedRegs.map((r) => r.id));
  }

  // Cancel the session
  const { data: updated } = await supabaseAdmin
    .from("sessions")
    .update({ status: "cancelled", cancelled_at: now, updated_at: now })
    .eq("id", sessionId)
    .select()
    .single();

  await trackEvent("session_cancelled", {
    user_id: auth.appUserId,
    club_id: session.club_id,
    session_id: sessionId,
    participants_affected: confirmedRegs?.length ?? 0,
  });

  return ok(updated);
}
