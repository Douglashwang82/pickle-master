import { notFound } from "next/navigation";
import nextDynamic from "next/dynamic";
import { supabaseAdmin } from "@/lib/db";
import KpiCard from "@/components/clubs/manage/KpiCard";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompactTWD } from "@/lib/charts/tokens";

const chartSkeleton = <Skeleton className="h-64 w-full rounded-2xl" />;

const RevenueTrendChart = nextDynamic(
  () => import("@/components/clubs/manage/charts/RevenueTrendChart"),
  { ssr: false, loading: () => chartSkeleton }
);
const FillRateChart = nextDynamic(
  () => import("@/components/clubs/manage/charts/FillRateChart"),
  { ssr: false, loading: () => chartSkeleton }
);
const MemberGrowthChart = nextDynamic(
  () => import("@/components/clubs/manage/charts/MemberGrowthChart"),
  { ssr: false, loading: () => chartSkeleton }
);
const FeeTierDonut = nextDynamic(
  () => import("@/components/clubs/manage/charts/FeeTierDonut"),
  { ssr: false, loading: () => chartSkeleton }
);
const TopSessionsBar = nextDynamic(
  () => import("@/components/clubs/manage/charts/TopSessionsBar"),
  { ssr: false, loading: () => chartSkeleton }
);
const AttendanceHeatmap = nextDynamic(
  () => import("@/components/clubs/manage/AttendanceHeatmap"),
  { ssr: false, loading: () => <Skeleton className="h-48 w-full rounded-2xl" /> }
);

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

type Point = { x: string; y: number };

async function buildAnalytics(clubId: string) {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
    999
  );
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [paymentsRes, sessionsRes, membershipsRes, applicationsRes] =
    await Promise.all([
      supabaseAdmin
        .from("payment_transactions")
        .select("amount_twd, created_at, session_id")
        .eq("club_id", clubId)
        .eq("status", "succeeded"),
      supabaseAdmin
        .from("sessions")
        .select("id, title, status, capacity, scheduled_start_at, fee_twd")
        .eq("club_id", clubId),
      supabaseAdmin
        .from("club_memberships")
        .select("joined_at, status")
        .eq("club_id", clubId)
        .eq("status", "active"),
      supabaseAdmin
        .from("membership_applications")
        .select("id", { count: "exact", head: true })
        .eq("club_id", clubId)
        .eq("status", "pending"),
    ]);

  const payments = paymentsRes.data ?? [];
  const sessions = sessionsRes.data ?? [];
  const members = membershipsRes.data ?? [];
  const pendingApplications = applicationsRes.count ?? 0;

  // Revenue
  const totalRevenue = payments.reduce((s, p) => s + p.amount_twd, 0);
  const thisMonthRevenue = payments
    .filter((p) => new Date(p.created_at) >= startOfThisMonth)
    .reduce((s, p) => s + p.amount_twd, 0);
  const lastMonthRevenue = payments
    .filter((p) => {
      const d = new Date(p.created_at);
      return d >= startOfLastMonth && d <= endOfLastMonth;
    })
    .reduce((s, p) => s + p.amount_twd, 0);

  // Revenue per month over last 6 months
  const monthBuckets: Point[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthBuckets.push({ x: d.toISOString(), y: 0 });
  }
  for (const p of payments) {
    const d = new Date(p.created_at);
    if (d < sixMonthsAgo) continue;
    const idx = monthBuckets.findIndex((b) => {
      const bd = new Date(b.x);
      return (
        bd.getFullYear() === d.getFullYear() && bd.getMonth() === d.getMonth()
      );
    });
    if (idx >= 0) monthBuckets[idx].y += p.amount_twd;
  }

  // Sessions
  const completedSessions = sessions.filter(
    (s) => s.status === "completed" || s.status === "auto_closed"
  );
  const upcomingSessions = sessions.filter(
    (s) =>
      (s.status === "published" || s.status === "full") &&
      new Date(s.scheduled_start_at) > now
  );

  const completedIds = completedSessions.map((s) => s.id);
  const regCountMap: Record<string, number> = {};
  if (completedIds.length > 0) {
    const { data: regs } = await supabaseAdmin
      .from("session_registrations")
      .select("session_id")
      .in("session_id", completedIds)
      .eq("status", "confirmed");
    for (const r of regs ?? []) {
      regCountMap[r.session_id] = (regCountMap[r.session_id] ?? 0) + 1;
    }
  }
  const fillRates = completedSessions
    .filter((s) => s.capacity > 0)
    .map((s) => ({
      x: s.scheduled_start_at,
      y: Math.round(((regCountMap[s.id] ?? 0) / s.capacity) * 1000) / 10,
    }))
    .sort((a, b) => a.x.localeCompare(b.x))
    .slice(-12);

  const avgFillRate =
    fillRates.length > 0
      ? Math.round(fillRates.reduce((s, p) => s + p.y, 0) / fillRates.length)
      : 0;

  // Members cumulative growth (last 6 months)
  const memberGrowth: Point[] = monthBuckets.map((b) => ({ x: b.x, y: 0 }));
  const sortedMembers = [...members]
    .map((m) => m.joined_at)
    .sort((a, b) => a.localeCompare(b));
  for (let i = 0; i < memberGrowth.length; i++) {
    const cutoff = new Date(
      now.getFullYear(),
      now.getMonth() - (5 - i) + 1,
      1
    );
    memberGrowth[i].y = sortedMembers.filter(
      (j) => new Date(j) < cutoff
    ).length;
  }

  const joinedThisMonth = members.filter(
    (m) => new Date(m.joined_at) >= startOfThisMonth
  ).length;
  const joinedLastMonth = members.filter((m) => {
    const d = new Date(m.joined_at);
    return d >= startOfLastMonth && d <= endOfLastMonth;
  }).length;

  // Fee tier breakdown
  const feeTiers = { 免費: 0, "≤200": 0, "201-400": 0, "401-600": 0, "≥601": 0 };
  for (const s of sessions) {
    const f = s.fee_twd ?? 0;
    if (f === 0) feeTiers["免費"] += 1;
    else if (f <= 200) feeTiers["≤200"] += 1;
    else if (f <= 400) feeTiers["201-400"] += 1;
    else if (f <= 600) feeTiers["401-600"] += 1;
    else feeTiers["≥601"] += 1;
  }
  const feeTierData = Object.entries(feeTiers).map(([label, value]) => ({
    label,
    value,
  }));

  // Top sessions by revenue
  const revenueBySession: Record<string, number> = {};
  for (const p of payments) {
    if (!p.session_id) continue;
    revenueBySession[p.session_id] =
      (revenueBySession[p.session_id] ?? 0) + p.amount_twd;
  }
  const sessionTitles: Record<string, string> = Object.fromEntries(
    sessions.map((s) => [s.id, s.title])
  );
  const topSessions = Object.entries(revenueBySession)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, value]) => ({
      label: sessionTitles[id] ?? id.slice(0, 6),
      value,
    }));

  // Heatmap (90d)
  const heatmapStart = new Date(now);
  heatmapStart.setDate(heatmapStart.getDate() - 90);
  const heatSessIds = sessions
    .filter((s) => new Date(s.scheduled_start_at) >= heatmapStart)
    .map((s) => s.id);
  const heatRegCount: Record<string, number> = {};
  if (heatSessIds.length > 0) {
    const { data: regs } = await supabaseAdmin
      .from("session_registrations")
      .select("session_id")
      .in("session_id", heatSessIds)
      .eq("status", "confirmed");
    for (const r of regs ?? []) {
      heatRegCount[r.session_id] = (heatRegCount[r.session_id] ?? 0) + 1;
    }
  }
  const matrix: number[][] = Array.from({ length: 7 }, () =>
    Array(24).fill(0)
  );
  let heatMax = 0;
  for (const s of sessions) {
    const d = new Date(s.scheduled_start_at);
    if (d < heatmapStart) continue;
    const day = d.getDay();
    const hour = d.getHours();
    const count = heatRegCount[s.id] ?? 0;
    matrix[day][hour] += count;
    if (matrix[day][hour] > heatMax) heatMax = matrix[day][hour];
  }

  return {
    revenue: {
      total: totalRevenue,
      thisMonth: thisMonthRevenue,
      lastMonth: lastMonthRevenue,
    },
    sessions: {
      upcoming: upcomingSessions.length,
      completed: completedSessions.length,
      avgFillRate,
    },
    members: {
      active: members.length,
      joinedThisMonth,
      joinedLastMonth,
      pending: pendingApplications,
    },
    monthBuckets,
    fillRates,
    memberGrowth,
    feeTierData,
    topSessions,
    heatmap: { matrix, max: heatMax },
  };
}

export default async function ManageOverviewPage({ params }: Params) {
  const { slug } = await params;

  const { data: club } = await supabaseAdmin
    .from("clubs")
    .select("id")
    .eq("slug", slug)
    .single();
  if (!club) notFound();

  const data = await buildAnalytics(club.id);

  const revenueSpark = data.monthBuckets.map((b) => ({ x: b.x, y: b.y }));
  const memberSpark = data.memberGrowth.map((b) => ({ x: b.x, y: b.y }));
  const fillSpark = data.fillRates.slice(-6);

  const isEmpty =
    data.revenue.total === 0 &&
    data.sessions.completed === 0 &&
    data.sessions.upcoming === 0 &&
    data.members.active === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/40 py-20 text-center">
        <p className="text-base font-medium">尚無資料可分析</p>
        <p className="mt-1 text-sm text-muted-foreground">
          建立第一場場次、邀請成員加入後，這裡會顯示營收與出席的視覺化分析。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="本月營收"
          value={formatCompactTWD(data.revenue.thisMonth)}
          delta={{
            current: data.revenue.thisMonth,
            previous: data.revenue.lastMonth,
          }}
          spark={revenueSpark}
          accent="primary"
        />
        <KpiCard
          label="即將舉辦場次"
          value={`${data.sessions.upcoming}`}
          spark={undefined}
          accent="warning"
        />
        <KpiCard
          label="在籍成員"
          value={`${data.members.active}`}
          delta={{
            current: data.members.joinedThisMonth,
            previous: data.members.joinedLastMonth,
          }}
          spark={memberSpark}
          accent="success"
        />
        <KpiCard
          label="平均入場率"
          value={`${data.sessions.avgFillRate}%`}
          spark={fillSpark}
          accent="primary"
        />
      </section>

      {/* Trend charts */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <RevenueTrendChart data={data.monthBuckets} />
        </div>
        <FillRateChart data={data.fillRates} />
        <MemberGrowthChart data={data.memberGrowth} />
      </section>

      {/* Distribution */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FeeTierDonut data={data.feeTierData} />
        <TopSessionsBar data={data.topSessions} />
      </section>

      {/* Heatmap */}
      <section>
        <AttendanceHeatmap
          matrix={data.heatmap.matrix}
          max={data.heatmap.max}
        />
      </section>

      {data.members.pending > 0 && (
        <p className="text-sm text-muted-foreground">
          目前有 <span className="font-medium text-foreground">{data.members.pending}</span> 個申請等待審核 — 前往
          <a className="ml-1 underline" href={`/clubs/${slug}/manage/members`}>
            成員管理
          </a>
          。
        </p>
      )}
    </div>
  );
}
