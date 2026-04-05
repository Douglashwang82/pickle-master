import Link from "next/link";
import { supabaseAdmin } from "@/lib/db";
import { Button } from "@/components/ui/button";
import ClubCard from "@/components/clubs/ClubCard";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClubsDiscoveryPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const searchParams = await props.searchParams;
  const search = searchParams.q ?? "";

  let query = supabaseAdmin
    .from("clubs")
    .select("id, slug, name, description, sport_type, cover_image_url, public_status, status")
    .eq("public_status", "public")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(40);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data: clubs } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Discover Clubs</h1>
          <p className="text-muted-foreground text-sm mt-1">Find pickleball clubs near you</p>
        </div>
        <Button asChild>
          <Link href="/clubs/new">
            <Plus className="h-4 w-4 mr-1" />
            Create Club
          </Link>
        </Button>
      </div>

      {clubs && clubs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubs.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">No clubs found.</p>
          <p className="text-sm mt-1">Be the first to create one!</p>
        </div>
      )}
    </div>
  );
}
