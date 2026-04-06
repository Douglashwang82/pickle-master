import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";

type Params = { params: Promise<{ venueId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { venueId } = await params;

  const { data: venue } = await supabaseAdmin
    .from("venues")
    .select("id, name, address, district")
    .eq("id", venueId)
    .single();

  if (!venue) return fail("Venue not found", "NOT_FOUND", 404);

  // Aggregate ratings
  const { data: ratings } = await supabaseAdmin
    .from("venue_reviews")
    .select("facilities_rating, lighting_rating, floor_rating, transport_rating")
    .eq("venue_id", venueId);

  const count = ratings?.length ?? 0;
  const avg = (key: keyof NonNullable<typeof ratings>[0]) =>
    count > 0
      ? (ratings ?? []).reduce((sum, r) => sum + r[key], 0) / count
      : null;

  // Recent reviews with commenter display names
  const { data: recentReviews } = await supabaseAdmin
    .from("venue_reviews")
    .select(
      "id, facilities_rating, lighting_rating, floor_rating, transport_rating, comment, created_at, users!inner(profiles(display_name))"
    )
    .eq("venue_id", venueId)
    .order("created_at", { ascending: false })
    .limit(5);

  return ok({
    ...venue,
    ratings: {
      facilities: avg("facilities_rating"),
      lighting: avg("lighting_rating"),
      floor: avg("floor_rating"),
      transport: avg("transport_rating"),
      overall:
        count > 0
          ? [
              avg("facilities_rating")!,
              avg("lighting_rating")!,
              avg("floor_rating")!,
              avg("transport_rating")!,
            ].reduce((s, v) => s + v, 0) / 4
          : null,
      review_count: count,
    },
    recent_reviews: (recentReviews ?? []).map((r) => {
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
    }),
  });
}
