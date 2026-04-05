import { requireAuth, requireClubMember, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";

type Params = { params: Promise<{ sessionId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { sessionId } = await params;

  const { data: session } = await supabaseAdmin
    .from("sessions")
    .select("club_id")
    .eq("id", sessionId)
    .single();

  if (!session) return fail("Session not found", "NOT_FOUND", 404);

  const guardError = await requireClubMember(session.club_id, auth.appUserId);
  if (guardError) return guardError;

  const { data: registrations, error } = await supabaseAdmin
    .from("session_registrations")
    .select("id, user_id, status, joined_at")
    .eq("session_id", sessionId)
    .in("status", ["confirmed", "payment_pending"])
    .order("joined_at", { ascending: true });

  if (error) return fail("Failed to fetch roster", "DB_ERROR", 500);

  const userIds = (registrations ?? []).map((r) => r.user_id);
  const { data: profiles } = userIds.length
    ? await supabaseAdmin
        .from("profiles")
        .select("user_id, display_name, photo_url, skill_level")
        .in("user_id", userIds)
    : { data: [] };

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p]));

  const result = (registrations ?? []).map((r) => ({
    ...r,
    profile: profileMap[r.user_id] ?? null,
  }));

  return ok(result);
}
