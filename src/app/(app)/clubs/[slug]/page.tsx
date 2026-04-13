import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import ClubDetailTabs from "@/components/clubs/ClubDetailTabs";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<{ tab?: string }> };

export default async function ClubDetailPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const { tab } = await searchParams;
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

  // Member count
  const { count: memberCount } = await supabaseAdmin
    .from("club_memberships")
    .select("*", { count: "exact", head: true })
    .eq("club_id", club.id)
    .eq("status", "active");

  // Resolve current user
  let appUserId: string | null = null;
  let currentMembership: { role: string; status: string } | null = null;
  let currentApplication: { id: string; status: string } | null = null;

  if (user) {
    const { data: appUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("auth_provider_user_id", user.id)
      .single();

    if (appUser) {
      appUserId = appUser.id;

      const { data: mem } = await supabaseAdmin
        .from("club_memberships")
        .select("role, status")
        .eq("club_id", club.id)
        .eq("user_id", appUser.id)
        .single();
      currentMembership = mem;

      if (!mem || mem.status !== "active") {
        const { data: app } = await supabaseAdmin
          .from("membership_applications")
          .select("id, status")
          .eq("club_id", club.id)
          .eq("user_id", appUser.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (app) currentApplication = app;
      }
    }
  }

  const isLeader =
    (currentMembership?.role === "leader" && currentMembership?.status === "active") ||
    club.owner_user_id === appUserId;
  const isMember = currentMembership?.status === "active" || club.owner_user_id === appUserId;

  // Determine default tab: members see Sessions; non-members see Info
  const validTabs = ["sessions", "members", "info", "settings"];
  const initialTab = tab && validTabs.includes(tab) ? tab : isMember ? "sessions" : "info";

  // Sessions (for Sessions tab)
  const { data: sessions } = await supabaseAdmin
    .from("sessions")
    .select("*")
    .eq("club_id", club.id)
    .in("status", ["published", "full"])
    .gte("scheduled_start_at", new Date().toISOString())
    .order("scheduled_start_at", { ascending: true });

  const sessionIds = (sessions ?? []).map((s) => s.id);
  const { data: regCounts } = sessionIds.length
    ? await supabaseAdmin
        .from("session_registrations")
        .select("session_id")
        .in("session_id", sessionIds)
        .eq("status", "confirmed")
    : { data: [] };

  const countMap: Record<string, number> = {};
  for (const r of regCounts ?? []) {
    countMap[r.session_id] = (countMap[r.session_id] ?? 0) + 1;
  }

  const sessionsWithSpots = (sessions ?? []).map((s) => ({
    ...s,
    confirmed_count: countMap[s.id] ?? 0,
    available_spots: s.capacity - (countMap[s.id] ?? 0),
  }));

  // Members + applications (for Members tab)
  const { data: membersRaw } = isMember
    ? await supabaseAdmin
        .from("club_memberships")
        .select("id, role, status, user_id, joined_at")
        .eq("club_id", club.id)
        .eq("status", "active")
        .order("joined_at", { ascending: true })
    : { data: [] };

  const { data: appsRaw } = isLeader
    ? await supabaseAdmin
        .from("membership_applications")
        .select("id, user_id, intro_message, created_at")
        .eq("club_id", club.id)
        .eq("status", "pending")
        .order("created_at", { ascending: true })
    : { data: [] };

  // Batch-fetch profiles for members + applicants
  const memberUserIds = (membersRaw ?? []).map((m) => m.user_id);
  const appUserIds = (appsRaw ?? []).map((a) => a.user_id);
  const allUserIds = Array.from(new Set([...memberUserIds, ...appUserIds]));

  type Profile = { display_name: string; photo_url: string | null; skill_level: string | null; bio: string | null };
  const profileMap: Record<string, Profile> = {};
  if (allUserIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, display_name, photo_url, skill_level, bio")
      .in("user_id", allUserIds);
    for (const p of profiles ?? []) {
      profileMap[p.user_id] = p;
    }
  }

  const members = (membersRaw ?? []).map((m) => ({
    ...m,
    profile: profileMap[m.user_id] ?? null,
  }));

  const applications = (appsRaw ?? []).map((a) => ({
    ...a,
    profiles: profileMap[a.user_id] ?? null,
  }));

  // Venues (for Create Session sheet)
  const { data: venuesRaw } = await supabaseAdmin
    .from("venues" as any)
    .select("id, name, district")
    .order("name");

  const venues = (venuesRaw ?? []) as { id: string; name: string; district?: string }[];

  return (
    <ClubDetailTabs
      club={{
        id: club.id,
        slug: club.slug,
        name: club.name,
        description: club.description,
        rules: club.rules,
        cover_image_url: club.cover_image_url,
        sport_type: club.sport_type,
        public_status: club.public_status === "private" ? "private" : "public",
        owner_user_id: club.owner_user_id,
      }}
      initialTab={initialTab}
      isLeader={isLeader}
      isMember={isMember}
      memberCount={memberCount ?? 0}
      sessions={sessionsWithSpots}
      members={members}
      applications={applications}
      venues={venues}
      currentApplication={currentApplication}
    />
  );
}
