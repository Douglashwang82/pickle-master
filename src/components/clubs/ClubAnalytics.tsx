import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { ClubAnalyticsData } from "@/app/api/clubs/[clubId]/analytics/route";

function formatTWD(amount: number): string {
  return `NT$${amount.toLocaleString()}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function MoMBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  const up = pct >= 0;
  return (
    <span
      className={`text-xs font-medium ${up ? "text-green-600" : "text-red-500"}`}
    >
      {up ? "+" : ""}
      {pct}% vs last month
    </span>
  );
}

type Props = {
  data: ClubAnalyticsData;
};

export default function ClubAnalytics({ data }: Props) {
  const { revenue, sessions, members, recent_sessions } = data;

  return (
    <div className="space-y-6">
      {/* ── Revenue ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Revenue
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                All-Time
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold">{formatTWD(revenue.total_twd)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-1">
              <p className="text-2xl font-bold">{formatTWD(revenue.this_month_twd)}</p>
              <MoMBadge
                current={revenue.this_month_twd}
                previous={revenue.last_month_twd}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* ── Sessions ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Sessions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Held
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold">{sessions.total_held}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold">{sessions.upcoming_count}</p>
            </CardContent>
          </Card>
        </div>

        {sessions.total_held > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Avg Fill Rate
                </CardTitle>
                <span className="text-sm font-bold">{sessions.avg_fill_rate}%</span>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Progress value={sessions.avg_fill_rate} className="h-2" />
              {sessions.cancelled_count > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {sessions.cancelled_count} session
                  {sessions.cancelled_count !== 1 ? "s" : ""} cancelled all-time
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      <Separator />

      {/* ── Members ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Members
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold">{members.active_count}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Joined This Month
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold">{members.joined_this_month}</p>
            </CardContent>
          </Card>
        </div>
        {members.pending_applications > 0 && (
          <p className="text-sm text-muted-foreground">
            {members.pending_applications} pending application
            {members.pending_applications !== 1 ? "s" : ""} awaiting review
          </p>
        )}
      </section>

      {/* ── Recent Sessions ── */}
      {recent_sessions.length > 0 && (
        <>
          <Separator />
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Recent Sessions
            </h2>
            <div className="space-y-2">
              {recent_sessions.map((s) => {
                const fillPct =
                  s.capacity > 0
                    ? Math.round((s.confirmed_count / s.capacity) * 100)
                    : 0;
                return (
                  <Card key={s.id}>
                    <CardContent className="px-4 py-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{s.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(s.scheduled_start_at)}
                          </p>
                        </div>
                        {s.revenue_twd > 0 && (
                          <span className="text-sm font-semibold shrink-0">
                            {formatTWD(s.revenue_twd)}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            {s.confirmed_count} / {s.capacity} players
                          </span>
                          <span>{fillPct}% filled</span>
                        </div>
                        <Progress value={fillPct} className="h-1.5" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* Empty state */}
      {sessions.total_held === 0 && recent_sessions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Analytics will appear once your first session is completed.
        </div>
      )}
    </div>
  );
}
