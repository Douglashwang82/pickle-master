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
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border/40 pb-6 mb-8 gap-4">
        <div className="space-y-3">
          <div className="inline-block px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-accent text-accent-foreground shadow-sm">
            Club Directory
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">Discover Clubs</h1>
          <p className="text-muted-foreground text-lg max-w-xl">Find your community and hit the courts. Join an existing club or start your own.</p>
        </div>
        <Button asChild className="rounded-full font-bold shadow-sm md:w-auto w-full group py-6 px-6">
          <Link href="/clubs/new">
            <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
            Create Club
          </Link>
        </Button>
      </div>

      {clubs && clubs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {clubs.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-4 mt-8 bg-card rounded-3xl border border-dashed border-border/60">
          <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <p className="text-xl font-bold mb-2">No clubs found.</p>
          <p className="text-muted-foreground max-w-sm mx-auto">Be the first to create a pickleball club in your area and start managing your sessions!</p>
        </div>
      )}
    </div>
  );
}
