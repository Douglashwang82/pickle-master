import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ApplicationReview from "@/components/clubs/ApplicationReview";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

type ProfileMap = Record<string, {
  display_name: string;
  photo_url: string | null;
  skill_level: string | null;
  bio: string | null;
}>;

export default async function MembersPage({ params }: Params) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: club } = await supabaseAdmin
    .from("clubs")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!club) notFound();

  const { data: appUser } = await supabaseAdmin
    .from("users").select("id").eq("auth_provider_user_id", user.id).single();
  if (!appUser) redirect("/login");

  const { data: myMembership } = await supabaseAdmin
    .from("club_memberships").select("role, status")
    .eq("club_id", club.id).eq("user_id", appUser.id).single();

  if (myMembership?.status !== "active") redirect(`/clubs/${slug}`);

  const isLeader = myMembership.role === "leader";

  // Fetch members
  const { data: membersRaw } = await supabaseAdmin
    .from("club_memberships")
    .select("id, role, status, user_id, joined_at")
    .eq("club_id", club.id)
    .eq("status", "active")
    .order("joined_at", { ascending: true });

  // Fetch pending applications
  const { data: appsRaw } = isLeader
    ? await supabaseAdmin
        .from("membership_applications")
        .select("id, user_id, intro_message, created_at")
        .eq("club_id", club.id)
        .eq("status", "pending")
        .order("created_at", { ascending: true })
    : { data: [] };

  // Collect all user IDs and batch-fetch profiles
  const memberUserIds = (membersRaw ?? []).map((m) => m.user_id);
  const appUserIds = (appsRaw ?? []).map((a) => a.user_id);
  const allUserIds = Array.from(new Set([...memberUserIds, ...appUserIds]));

  const profileMap: ProfileMap = {};
  if (allUserIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, display_name, photo_url, skill_level, bio")
      .in("user_id", allUserIds);
    for (const p of profiles ?? []) {
      profileMap[p.user_id] = p;
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Members — {club.name}</h1>

      {isLeader && (appsRaw ?? []).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Pending Applications ({appsRaw!.length})</h2>
          {appsRaw!.map((app) => (
            <ApplicationReview
              key={app.id}
              application={{ ...app, profiles: profileMap[app.user_id] ?? null }}
              clubId={club.id}
            />
          ))}
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Active Members ({membersRaw?.length ?? 0})</h2>
        <div className="space-y-2">
          {membersRaw?.map((m) => {
            const profile = profileMap[m.user_id] ?? null;
            return (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={profile?.photo_url ?? undefined} />
                  <AvatarFallback>{profile?.display_name?.[0] ?? "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{profile?.display_name ?? "Unknown"}</p>
                  {profile?.skill_level && (
                    <p className="text-xs text-muted-foreground capitalize">{profile.skill_level}</p>
                  )}
                </div>
                <Badge variant={m.role === "leader" ? "default" : "secondary"} className="capitalize">
                  {m.role}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
