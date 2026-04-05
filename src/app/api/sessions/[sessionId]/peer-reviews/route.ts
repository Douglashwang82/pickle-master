import { requireAuth, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";
import { PeerReviewBatchSchema } from "@/lib/validations/reviews";
import { trackEvent } from "@/lib/analytics";

type Params = { params: Promise<{ sessionId: string }> };

const REVIEWABLE_STATUSES = ["completed", "auto_closed"] as const;

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { sessionId } = await params;

  const body: unknown = await request.json().catch(() => ({}));
  const parsed = PeerReviewBatchSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation error", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  // Session must be completed/auto_closed
  const { data: session } = await supabaseAdmin
    .from("sessions")
    .select("id, status, club_id")
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

  // Guard: all reviewees must not be the reviewer
  const selfReview = parsed.data.reviews.find(
    (r) => r.reviewee_user_id === auth.appUserId
  );
  if (selfReview) {
    return fail("Cannot review yourself", "INVALID_REVIEWEE", 400);
  }

  // Upsert reviews (idempotent on the unique constraint)
  const rows = parsed.data.reviews.map((r) => ({
    session_id: sessionId,
    reviewer_user_id: auth.appUserId,
    reviewee_user_id: r.reviewee_user_id,
    rating: r.rating,
    badges: r.badges,
  }));

  const { error: insertError } = await supabaseAdmin
    .from("peer_reviews")
    .upsert(rows, { onConflict: "session_id,reviewer_user_id,reviewee_user_id" });

  if (insertError) {
    return fail("Failed to save reviews", "DB_ERROR", 500);
  }

  // Recompute reputation for each reviewee
  const revieweeIds = [...new Set(rows.map((r) => r.reviewee_user_id))];
  await Promise.all(
    revieweeIds.map(async (userId) => {
      const { data: agg } = await supabaseAdmin
        .from("peer_reviews")
        .select("rating")
        .eq("reviewee_user_id", userId);

      if (!agg || agg.length === 0) return;

      const avg = agg.reduce((sum, r) => sum + r.rating, 0) / agg.length;
      await supabaseAdmin
        .from("profiles")
        .update({
          reputation_score: Math.round(avg * 100) / 100,
          review_count: agg.length,
        })
        .eq("user_id", userId);
    })
  );

  await trackEvent("peer_review_submitted", {
    session_id: sessionId,
    club_id: session.club_id,
    reviewer_id: auth.appUserId,
    reviewee_count: rows.length,
    avg_rating_given:
      rows.reduce((sum, r) => sum + r.rating, 0) / rows.length,
  });

  return ok({ submitted: rows.length });
}
