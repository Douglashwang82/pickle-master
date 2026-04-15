import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import ClubDetailTabs from "@/components/clubs/ClubDetailTabs";
import type { ClubAnalyticsData } from "@/app/api/clubs/[clubId]/analytics/route";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<{ tab?: string }> };

export default async function ClubDetailPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch club (public — no auth required)
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

  // Resolve current user (optional — guests see a read-only view)
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
  const isAuthenticated = !!user;

  // Default tab: members see Sessions; non-members/guests see Info
  const validTabs = ["sessions", "members", "info", "analytics", "settings"];
  const initialTab = tab && validTabs.includes(tab) ? tab : isMember ? "sessions" : "info";

  // Sessions (for Sessions tab — visible to all)
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

  // Members + applications (only for active members)
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

  // Analytics data (leaders only)
  let analyticsData: ClubAnalyticsData | null = null;
  if (isLeader) {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999
    ).toISOString();

    const { data: allPayments } = await supabaseAdmin
      .from("payment_transactions")
      .select("amount_twd, created_at")
      .eq("club_id", club.id)
      .eq("status", "succeeded");

    const payments = allPayments ?? [];
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount_twd, 0);
    const thisMonthRevenue = payments
      .filter((p) => p.created_at >= startOfThisMonth)
      .reduce((sum, p) => sum + p.amount_twd, 0);
    const lastMonthRevenue = payments
      .filter((p) => p.created_at >= startOfLastMonth && p.created_at <= endOfLastMonth)
      .reduce((sum, p) => sum + p.amount_twd, 0);

    const { data: allSessions } = await supabaseAdmin
      .from("sessions")
      .select("id, title, status, capacity, scheduled_start_at")
      .eq("club_id", club.id);

    const allSess = allSessions ?? [];
    const completedSessions = allSess.filter(
      (s) => s.status === "completed" || s.status === "auto_closed"
    );
    const upcomingSessions = allSess.filter(
      (s) =>
        (s.status === "published" || s.status === "full") &&
        s.scheduled_start_at > now.toISOString()
    );
    const cancelledSessions = allSess.filter((s) => s.status === "cancelled");

    let avgFillRate = 0;
    let recentAnalyticsSessions: ClubAnalyticsData["recent_sessions"] = [];

    if (completedSessions.length > 0) {
      const completedIds = completedSessions.map((s) => s.id);

      const { data: completedRegs } = await supabaseAdmin
        .from("session_registrations")
        .select("session_id")
        .in("session_id", completedIds)
        .eq("status", "confirmed");

      const regCountMap: Record<string, number> = {};
      for (const r of completedRegs ?? []) {
        regCountMap[r.session_id] = (regCountMap[r.session_id] ?? 0) + 1;
      }

      const rates = completedSessions.map((s) =>
        s.capacity > 0 ? (regCountMap[s.id] ?? 0) / s.capacity : 0
      );
      avgFillRate = Math.round(
        (rates.reduce((a, b) => a + b, 0) / rates.length) * 100
      );

      const recent5 = [...completedSessions]
        .sort((a, b) => b.scheduled_start_at.localeCompare(a.scheduled_start_at))
        .slice(0, 5);

      const recent5Ids = recent5.map((s) => s.id);
      const { data: recentPay } = await supabaseAdmin
        .from("payment_transactions")
        .select("session_id, amount_twd")
        .in("session_id", recent5Ids)
        .eq("club_id", club.id)
        .eq("status", "succeeded");

      const revenueMap: Record<string, number> = {};
      for (const p of recentPay ?? []) {
        revenueMap[p.session_id] = (revenueMap[p.session_id] ?? 0) + p.amount_twd;
      }

      recentAnalyticsSessions = recent5.map((s) => ({
        id: s.id,
        title: s.title,
        scheduled_start_at: s.scheduled_start_at,
        capacity: s.capacity,
        confirmed_count: regCountMap[s.id] ?? 0,
        revenue_twd: revenueMap[s.id] ?? 0,
      }));
    }

    const { data: analyticsMembers } = await supabaseAdmin
      .from("club_memberships")
      .select("joined_at")
      .eq("club_id", club.id)
      .eq("status", "active");

    const analyticsMemberList = analyticsMembers ?? [];
    const joinedThisMonth = analyticsMemberList.filter(
      (m) => m.joined_at >= startOfThisMonth
    ).length;

    const { count: pendingApplications } = await supabaseAdmin
      .from("membership_applications")
      .select("*", { count: "exact", head: true })
      .eq("club_id", club.id)
      .eq("status", "pending");

    analyticsData = {
      revenue: {
        total_twd: totalRevenue,
        this_month_twd: thisMonthRevenue,
        last_month_twd: lastMonthRevenue,
      },
      sessions: {
        total_held: completedSessions.length,
        upcoming_count: upcomingSessions.length,
        cancelled_count: cancelledSessions.length,
        avg_fill_rate: avgFillRate,
      },
      members: {
        active_count: analyticsMemberList.length,
        joined_this_month: joinedThisMonth,
        pending_applications: pendingApplications ?? 0,
      },
      recent_sessions: recentAnalyticsSessions,
    };
  }

  // Venues (for Create Session sheet — leaders only)
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
      isAuthenticated={isAuthenticated}
      memberCount={memberCount ?? 0}
      sessions={sessionsWithSpots}
      members={members}
      applications={applications}
      venues={venues}
      currentApplication={currentApplication}
      analyticsData={analyticsData}
    />
  );
}
