import { supabaseAdmin } from "@/lib/db";
import { Star, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

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

async function getVenuesWithRatings() {
  const { data: venues } = await supabaseAdmin
    .from("venues")
    .select(
      "id, name, address, district, venue_reviews(facilities_rating, lighting_rating, floor_rating, transport_rating)"
    )
    .order("name");

  return ((venues ?? []) as unknown as VenueWithRatings[]).map((venue) => {
    const reviews = venue.venue_reviews ?? [];

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
      id: venue.id,
      name: venue.name,
      address: venue.address,
      district: venue.district,
      avg_rating: overall !== null ? Math.round(overall * 10) / 10 : null,
      review_count: count,
    };
  });
}

export default async function VenuesPage() {
  const venues = await getVenuesWithRatings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">場地</h1>
        <p className="text-muted-foreground text-sm mt-1">
          由球員評分的匹克球場地
        </p>
      </div>

      {venues.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">目前尚無場地資料。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {venues.map((venue) => (
            <Link key={venue.id} href={`/venues/${venue.id}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{venue.name}</CardTitle>
                  {venue.district && (
                    <Badge variant="secondary" className="w-fit text-xs">
                      {venue.district}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {venue.address && (
                    <div className="flex items-start gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>{venue.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Star
                      className={`h-4 w-4 ${
                        venue.avg_rating !== null
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                    {venue.avg_rating !== null ? (
                      <span className="text-sm font-medium">{venue.avg_rating.toFixed(1)}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">尚無評分</span>
                    )}
                    {venue.review_count > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({venue.review_count})
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
