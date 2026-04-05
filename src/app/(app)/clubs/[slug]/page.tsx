import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Users, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export default async function ClubDetailPage({ params }: Params) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch club
  const { data: club } = await supabaseAdmin
    .from("clubs")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!club) notFound();

  // Fetch member count
  const { count: memberCount } = await supabaseAdmin
    .from("club_memberships")
    .select("*", { count: "exact", head: true })
    .eq("club_id", club.id)
    .eq("status", "active");

  // Check current user membership if logged in
  let currentMembership = null;
  if (user) {
    const { data: appUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("auth_provider_user_id", user.id)
      .single();

    if (appUser) {
      const { data: mem } = await supabaseAdmin
        .from("club_memberships")
        .select("role, status")
        .eq("club_id", club.id)
        .eq("user_id", appUser.id)
        .single();
      currentMembership = mem;
    }
  }

  const isLeader = currentMembership?.role === "leader" && currentMembership?.status === "active";
  const isMember = currentMembership?.status === "active";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {club.cover_image_url && (
        <div className="aspect-video overflow-hidden rounded-xl">
          <img src={club.cover_image_url} alt={club.name} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{club.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="capitalize">{club.sport_type}</Badge>
            <span className="text-sm text-muted-foreground">{memberCount ?? 0} members</span>
          </div>
        </div>
        {isLeader && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/clubs/${club.slug}/settings`}>
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Link>
          </Button>
        )}
      </div>

      {club.description && (
        <p className="text-muted-foreground">{club.description}</p>
      )}

      {club.rules && (
        <>
          <Separator />
          <div>
            <h2 className="font-semibold mb-2">Club Rules</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{club.rules}</p>
          </div>
        </>
      )}

      <Separator />

      <div className="flex flex-wrap gap-3">
        {isMember ? (
          <>
            <Button asChild>
              <Link href={`/clubs/${club.slug}/sessions`}>
                <Calendar className="h-4 w-4 mr-1" />
                Sessions
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/clubs/${club.slug}/members`}>
                <Users className="h-4 w-4 mr-1" />
                Members
              </Link>
            </Button>
          </>
        ) : (
          <ApplyButton clubId={club.id} clubSlug={club.slug} />
        )}
      </div>
    </div>
  );
}

// Inline client component for apply action
function ApplyButton({ clubId, clubSlug }: { clubId: string; clubSlug: string }) {
  // This renders as a server-side link to the apply page (client interactivity via dedicated page)
  return (
    <Button asChild>
      <Link href={`/clubs/${clubSlug}/apply`}>Apply to Join</Link>
    </Button>
  );
}
