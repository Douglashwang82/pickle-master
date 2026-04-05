import { supabaseAdmin } from "@/lib/db";
import { ok } from "@/lib/utils/api";

export async function GET() {
  // Fetch venues with aggregated average ratings from venue_reviews
  const { data: venues } = await supabaseAdmin
    .from("venues")
    .select(
      "id, name, address, district, venue_reviews(facilities_rating, lighting_rating, floor_rating, transport_rating)"
    )
    .order("name");

  const result = (venues ?? []).map((venue) => {
    const reviews = venue.venue_reviews as {
      facilities_rating: number;
      lighting_rating: number;
      floor_rating: number;
      transport_rating: number;
    }[];

    const count = reviews.length;
    if (count === 0) {
      return { ...venue, venue_reviews: undefined, avg_rating: null, review_count: 0 };
    }

    const avg = (key: keyof (typeof reviews)[0]) =>
      reviews.reduce((sum, r) => sum + r[key], 0) / count;

    const overall =
      (avg("facilities_rating") +
        avg("lighting_rating") +
        avg("floor_rating") +
        avg("transport_rating")) /
      4;

    return {
      id: venue.id,
      name: venue.name,
      address: venue.address,
      district: venue.district,
      avg_rating: Math.round(overall * 10) / 10,
      review_count: count,
    };
  });

  return ok(result);
}
