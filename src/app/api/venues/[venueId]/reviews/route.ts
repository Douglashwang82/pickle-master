import { requireAuth, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail, parseJsonBody } from "@/lib/utils/api";
import { VenueReviewSchema } from "@/lib/validations/reviews";
import { trackEvent } from "@/lib/analytics";

type Params = { params: Promise<{ venueId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { venueId } = await params;

  const { data: venue } = await supabaseAdmin
    .from("venues")
    .select("id")
    .eq("id", venueId)
    .single();

  if (!venue) return fail("Venue not found", "NOT_FOUND", 404);

  const { data: reviews } = await supabaseAdmin
    .from("venue_reviews")
    .select(
      "id, facilities_rating, lighting_rating, floor_rating, transport_rating, comment, created_at, users!inner(profiles(display_name))"
    )
    .eq("venue_id", venueId)
    .order("created_at", { ascending: false })
    .limit(20);

  const result = (reviews ?? []).map((r) => {
    const user = r.users as unknown as { profiles: { display_name: string } | null } | null;
    return {
      id: r.id,
      facilities_rating: r.facilities_rating,
      lighting_rating: r.lighting_rating,
      floor_rating: r.floor_rating,
      transport_rating: r.transport_rating,
      comment: r.comment,
      created_at: r.created_at,
      reviewer_name: user?.profiles?.display_name ?? "Player",
    };
  });

  return ok(result);
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { venueId } = await params;

  const { body, error: jsonError } = await parseJsonBody(request);
  if (jsonError) return jsonError;

  const parsed = VenueReviewSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation error", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  const { session_id, ...ratings } = parsed.data;

  // Venue must exist
  const { data: venue } = await supabaseAdmin
    .from("venues")
    .select("id")
    .eq("id", venueId)
    .single();

  if (!venue) return fail("Venue not found", "NOT_FOUND", 404);

  // Verify the session exists, is completed/auto_closed, and belongs to this venue
  const { data: session } = await supabaseAdmin
    .from("sessions")
    .select("id, status, club_id, venue_id")
    .eq("id", session_id)
    .eq("venue_id", venueId)
    .single();

  if (!session) {
    return fail("Session not found at this venue", "NOT_FOUND", 404);
  }

  if (!["completed", "auto_closed"].includes(session.status)) {
    return fail(
      "Venue reviews are only available for completed sessions",
      "SESSION_NOT_REVIEWABLE",
      409
    );
  }

  // Caller must have been a confirmed participant
  const { data: myReg } = await supabaseAdmin
    .from("session_registrations")
    .select("id")
    .eq("session_id", session_id)
    .eq("user_id", auth.appUserId)
    .eq("status", "confirmed")
    .single();

  if (!myReg) {
    return fail("You were not a confirmed participant of this session", "FORBIDDEN", 403);
  }

  // Upsert (idempotent on unique constraint)
  const { error: insertError } = await supabaseAdmin
    .from("venue_reviews")
    .upsert(
      {
        venue_id: venueId,
        session_id,
        reviewer_user_id: auth.appUserId,
        ...ratings,
      },
      { onConflict: "session_id,reviewer_user_id" }
    );

  if (insertError) {
    return fail("Failed to save venue review", "DB_ERROR", 500);
  }

  const overall =
    (ratings.facilities_rating +
      ratings.lighting_rating +
      ratings.floor_rating +
      ratings.transport_rating) /
    4;

  await trackEvent("venue_review_submitted", {
    venue_id: venueId,
    session_id,
    club_id: session.club_id,
    reviewer_id: auth.appUserId,
    overall_rating: Math.round(overall * 10) / 10,
  });

  return ok({ submitted: true });
}
