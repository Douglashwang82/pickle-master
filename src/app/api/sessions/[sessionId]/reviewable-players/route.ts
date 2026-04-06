import { requireAuth, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";

type Params = { params: Promise<{ sessionId: string }> };

const REVIEWABLE_STATUSES = ["completed", "auto_closed"] as const;

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { sessionId } = await params;

  // Session must be completed/auto_closed
  const { data: session } = await supabaseAdmin
    .from("sessions")
    .select("id, status")
    .eq("id", sessionId)
    .single();

  if (!session) return fail("Session not found", "NOT_FOUND", 404);

  if (!(REVIEWABLE_STATUSES as readonly string[]).includes(session.status)) {
    return fail(
      "Reviews are only available for completed sessions",
      "SESSION_NOT_REVIEWABLE",
      409
    );
  }

  // Caller must have been a confirmed participant
  const { data: myReg } = await supabaseAdmin
    .from("session_registrations")
    .select("id")
    .eq("session_id", sessionId)
    .eq("user_id", auth.appUserId)
    .eq("status", "confirmed")
    .single();

  if (!myReg) {
    return fail("You were not a confirmed participant of this session", "FORBIDDEN", 403);
  }

  // Fetch all other confirmed participants with their profile display name
  const { data: registrations } = await supabaseAdmin
    .from("session_registrations")
    .select("user_id, users!inner(id, profiles(display_name, photo_url, reputation_score, review_count))")
    .eq("session_id", sessionId)
    .eq("status", "confirmed")
    .neq("user_id", auth.appUserId);

  // Find which reviewees the caller has already reviewed
  const { data: existingReviews } = await supabaseAdmin
    .from("peer_reviews")
    .select("reviewee_user_id")
    .eq("session_id", sessionId)
    .eq("reviewer_user_id", auth.appUserId);

  const alreadyReviewed = new Set(
    (existingReviews ?? []).map((r) => r.reviewee_user_id)
  );

  const players = (registrations ?? []).map((reg) => {
    const user = reg.users as unknown as {
      id: string;
      profiles: { display_name: string; photo_url: string | null; reputation_score: number | null; review_count: number } | null;
    };
    return {
      user_id: reg.user_id,
      display_name: user?.profiles?.display_name ?? "Player",
      photo_url: user?.profiles?.photo_url ?? null,
      reputation_score: user?.profiles?.reputation_score ?? null,
      review_count: user?.profiles?.review_count ?? 0,
      already_reviewed: alreadyReviewed.has(reg.user_id),
    };
  });

  const has_reviewed_all = players.length > 0 && players.every((p) => p.already_reviewed);

  return ok({ players, has_reviewed_all });
}
