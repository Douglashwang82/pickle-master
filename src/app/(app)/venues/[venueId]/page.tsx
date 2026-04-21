import { requireAuth, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { Star, MapPin, Map } from "lucide-react";
import VenueRatingClient from "./VenueRatingClient";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ venueId: string }> };

type VenueWithRatings = {
  id: string;
  name: string;
  address: string | null;
  district: string | null;
  venue_reviews?: {
    facilities_rating: number;
    lighting_rating: number;
    floor_rating: number;
    transport_rating: number;
  }[];
};

async function getVenueDetails(venueId: string) {
  const { data: venue } = await supabaseAdmin
    .from("venues" as any)
    .select(
      "id, name, address, district, venue_reviews(facilities_rating, lighting_rating, floor_rating, transport_rating)"
    )
    .eq("id", venueId)
    .single();

  if (!venue) return null;

  const typedVenue = venue as unknown as VenueWithRatings;
  const reviews = typedVenue.venue_reviews ?? [];

  const count = reviews.length;
  const overall =
    count > 0
      ? reviews.reduce(
          (sum, r) =>
            sum +
            (r.facilities_rating +
              r.lighting_rating +
              r.floor_rating +
              r.transport_rating) /
              4,
          0
        ) / count
      : null;

  return {
    ...typedVenue,
    avg_rating: overall !== null ? Math.round(overall * 10) / 10 : null,
    review_count: count,
  };
}

async function getVenueReviews(venueId: string) {
  const { data: reviews } = await supabaseAdmin
    .from("venue_reviews" as any)
    .select(
      "id, facilities_rating, lighting_rating, floor_rating, transport_rating, comment, created_at, users!inner(profiles(display_name))"
    )
    .eq("venue_id", venueId)
    .order("created_at", { ascending: false });

  return (reviews ?? []).map((r: any) => ({
    id: r.id,
    avg_rating:
      (r.facilities_rating +
        r.lighting_rating +
        r.floor_rating +
        r.transport_rating) /
      4,
    comment: r.comment,
    created_at: r.created_at,
    reviewer_name: r.users?.profiles?.display_name ?? "Player",
  }));
}

async function getEligibleSessionToReview(venueId: string, userId: string) {
  // Find a completed session at this venue that the user attended and hasn't reviewed
  const { data: sessionsData } = await supabaseAdmin
    .from("sessions" as any)
    .select("id")
    .eq("venue_id", venueId)
    .in("status", ["completed", "auto_closed"])
    .order("start_time", { ascending: false });

  const sessions = (sessionsData ?? []) as unknown as { id: string }[];
  if (!sessions || sessions.length === 0) return null;

  for (const session of sessions) {
    // Were they confirmed?
    const { data: reg } = await supabaseAdmin
      .from("session_registrations" as any)
      .select("id")
      .eq("session_id", session.id)
      .eq("user_id", userId)
      .eq("status", "confirmed")
      .single();

    if (reg) {
      // Did they already review it?
      const { data: review } = await supabaseAdmin
        .from("venue_reviews" as any)
        .select("id")
        .eq("session_id", session.id)
        .eq("reviewer_user_id", userId)
        .single();
      
      if (!review) {
        return session.id;
      }
    }
  }

  return null;
}

export default async function VenueDetailPage({ params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) redirect("/login");

  const { venueId } = await params;
  const [venue, reviews, eligibleSessionId] = await Promise.all([
    getVenueDetails(venueId),
    getVenueReviews(venueId),
    getEligibleSessionToReview(venueId, auth.appUserId)
  ]);

  if (!venue) {
    notFound();
  }

  const encodedAddress = encodeURIComponent(venue.address || venue.name || "Taiwan");

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{venue.name}</h1>
          <div className="flex items-center gap-2 mt-2 text-muted-foreground">
            {venue.district && <MapPin className="w-4 h-4" />}
            <span>{venue.district || "位置"}</span>
            {venue.address && <span>• {venue.address}</span>}
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <Star
              className={`h-5 w-5 ${
                venue.avg_rating !== null
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              }`}
            />
            {venue.avg_rating !== null ? (
              <span className="font-medium">{venue.avg_rating.toFixed(1)}</span>
            ) : (
              <span className="text-muted-foreground text-sm">尚無評分</span>
            )}
            <span className="text-muted-foreground text-sm">
              ({venue.review_count} 則評論)
            </span>
          </div>
        </div>

        {eligibleSessionId && (
          <VenueRatingClient
            venueId={venue.id}
            venueName={venue.name}
            sessionId={eligibleSessionId}
          />
        )}
      </div>

      {/* Map */}
      <div className="w-full bg-muted rounded-xl overflow-hidden border border-border h-[300px] flex items-center justify-center">
        {venue.address ? (
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0 }}
            src={`https://www.google.com/maps?q=${encodedAddress}&output=embed`}
            allowFullScreen
          ></iframe>
        ) : (
          <div className="flex flex-col items-center text-muted-foreground gap-2">
            <Map className="w-8 h-8" />
            <p>未提供地圖地址</p>
          </div>
        )}
      </div>

      {/* Reviews Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">球員評價</h2>
        {reviews.length === 0 ? (
          <p className="text-muted-foreground py-4">此場地目前尚無評價。</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <div key={review.id} className="p-4 border border-border rounded-lg bg-card">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium">{review.reviewer_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(review.created_at), "PPP")}
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{review.avg_rating.toFixed(1)}</span>
                </div>
                {review.comment && (
                  <p className="text-sm text-foreground">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
