import { requireAuth, requireClubLeader, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";

type Params = { params: Promise<{ clubId: string }> };

export type ClubAnalyticsData = {
  revenue: {
    total_twd: number;
    this_month_twd: number;
    last_month_twd: number;
  };
  sessions: {
    total_held: number;
    upcoming_count: number;
    cancelled_count: number;
    avg_fill_rate: number; // 0–100
  };
  members: {
    active_count: number;
    joined_this_month: number;
    pending_applications: number;
  };
  recent_sessions: Array<{
    id: string;
    title: string;
    scheduled_start_at: string;
    capacity: number;
    confirmed_count: number;
    revenue_twd: number;
  }>;
};

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { clubId } = await params;

  const guardError = await requireClubLeader(clubId, auth.appUserId);
  if (guardError) return guardError;

  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();

  // ── Revenue ──────────────────────────────────────────────────────────────
  const { data: allPayments, error: payErr } = await supabaseAdmin
    .from("payment_transactions")
    .select("amount_twd, created_at")
    .eq("club_id", clubId)
    .eq("status", "succeeded");

  if (payErr) return fail("Failed to fetch payments", "DB_ERROR", 500);

  const payments = allPayments ?? [];
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount_twd, 0);
  const thisMonthRevenue = payments
    .filter((p) => p.created_at >= startOfThisMonth)
    .reduce((sum, p) => sum + p.amount_twd, 0);
  const lastMonthRevenue = payments
    .filter((p) => p.created_at >= startOfLastMonth && p.created_at <= endOfLastMonth)
    .reduce((sum, p) => sum + p.amount_twd, 0);

  // ── Sessions ─────────────────────────────────────────────────────────────
  const { data: allSessions, error: sessErr } = await supabaseAdmin
    .from("sessions")
    .select("id, title, status, capacity, scheduled_start_at")
    .eq("club_id", clubId);

  if (sessErr) return fail("Failed to fetch sessions", "DB_ERROR", 500);

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

  // Avg fill rate and recent sessions (completed only)
  let avgFillRate = 0;
  let recentSessions: ClubAnalyticsData["recent_sessions"] = [];

  if (completedSessions.length > 0) {
    const completedIds = completedSessions.map((s) => s.id);

    const { data: regs } = await supabaseAdmin
      .from("session_registrations")
      .select("session_id")
      .in("session_id", completedIds)
      .eq("status", "confirmed");

    const regCountMap: Record<string, number> = {};
    for (const r of regs ?? []) {
      regCountMap[r.session_id] = (regCountMap[r.session_id] ?? 0) + 1;
    }

    const rates = completedSessions.map((s) =>
      s.capacity > 0 ? (regCountMap[s.id] ?? 0) / s.capacity : 0
    );
    avgFillRate = Math.round(
      (rates.reduce((a, b) => a + b, 0) / rates.length) * 100
    );

    // Most recent 5 completed sessions
    const recent5 = [...completedSessions]
      .sort((a, b) => b.scheduled_start_at.localeCompare(a.scheduled_start_at))
      .slice(0, 5);

    const recent5Ids = recent5.map((s) => s.id);
    const { data: recentPay } = await supabaseAdmin
      .from("payment_transactions")
      .select("session_id, amount_twd")
      .in("session_id", recent5Ids)
      .eq("club_id", clubId)
      .eq("status", "succeeded");

    const revenueMap: Record<string, number> = {};
    for (const p of recentPay ?? []) {
      revenueMap[p.session_id] = (revenueMap[p.session_id] ?? 0) + p.amount_twd;
    }

    recentSessions = recent5.map((s) => ({
      id: s.id,
      title: s.title,
      scheduled_start_at: s.scheduled_start_at,
      capacity: s.capacity,
      confirmed_count: regCountMap[s.id] ?? 0,
      revenue_twd: revenueMap[s.id] ?? 0,
    }));
  }

  // ── Members ──────────────────────────────────────────────────────────────
  const { data: activeMembers } = await supabaseAdmin
    .from("club_memberships")
    .select("joined_at")
    .eq("club_id", clubId)
    .eq("status", "active");

  const members = activeMembers ?? [];
  const joinedThisMonth = members.filter((m) => m.joined_at >= startOfThisMonth).length;

  const { count: pendingApplications } = await supabaseAdmin
    .from("membership_applications")
    .select("*", { count: "exact", head: true })
    .eq("club_id", clubId)
    .eq("status", "pending");

  const analytics: ClubAnalyticsData = {
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
      active_count: members.length,
      joined_this_month: joinedThisMonth,
      pending_applications: pendingApplications ?? 0,
    },
    recent_sessions: recentSessions,
  };

  return ok(analytics);
}
