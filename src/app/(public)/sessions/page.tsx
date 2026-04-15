import { Suspense } from "react";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { MapPin, Users, DollarSign, Calendar, Search } from "lucide-react";
import PublicSessionSearch from "@/components/sessions/PublicSessionSearch";

export const dynamic = "force-dynamic";

const LIMIT = 24;

type SearchParams = {
  q?: string;
  page?: string;
};

type PublicSession = {
  id: string;
  title: string;
  scheduled_start_at: string;
  scheduled_end_at: string;
  location_name: string;
  capacity: number;
  fee_twd: number;
  status: string;
  confirmed_count: number;
  available_spots: number;
  club_name: string;
  club_slug: string;
};

async function fetchSessions(sp: SearchParams): Promise<{
  sessions: PublicSession[];
  total: number;
  page: number;
}> {
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const q = sp.q?.trim() || null;
  const offset = (page - 1) * LIMIT;
  const now = new Date().toISOString();

  // Base query: upcoming published/full sessions joined with clubs
  let query = supabaseAdmin
    .from("sessions")
    .select(`
      id, title, scheduled_start_at, scheduled_end_at,
      location_name, capacity, fee_twd, status,
      clubs!inner(id, name, slug, status)
    `)
    .in("status", ["published", "full"])
    .gte("scheduled_start_at", now)
    .eq("clubs.status", "active")
    .order("scheduled_start_at", { ascending: true });

  if (q) {
    query = query.or(`title.ilike.%${q}%,location_name.ilike.%${q}%`);
  }

  const { data: sessionsRaw, count: totalRaw } = await query
    .range(offset, offset + LIMIT - 1)
    .returns<Array<{
      id: string;
      title: string;
      scheduled_start_at: string;
      scheduled_end_at: string;
      location_name: string;
      capacity: number;
      fee_twd: number;
      status: string;
      clubs: { id: string; name: string; slug: string; status: string };
    }>>();

  const sessions = sessionsRaw ?? [];

  // Count confirmed registrations per session
  const sessionIds = sessions.map((s) => s.id);
  const regCountMap: Record<string, number> = {};
  if (sessionIds.length > 0) {
    const { data: regs } = await supabaseAdmin
      .from("session_registrations")
      .select("session_id")
      .in("session_id", sessionIds)
      .eq("status", "confirmed");
    for (const r of regs ?? []) {
      regCountMap[r.session_id] = (regCountMap[r.session_id] ?? 0) + 1;
    }
  }

  // Count total (separate query without range)
  let countQuery = supabaseAdmin
    .from("sessions")
    .select("id, clubs!inner(status)", { count: "exact", head: true })
    .in("status", ["published", "full"])
    .gte("scheduled_start_at", now)
    .eq("clubs.status", "active");

  if (q) {
    countQuery = countQuery.or(`title.ilike.%${q}%,location_name.ilike.%${q}%`);
  }
  const { count: total } = await countQuery;

  const result: PublicSession[] = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    scheduled_start_at: s.scheduled_start_at,
    scheduled_end_at: s.scheduled_end_at,
    location_name: s.location_name,
    capacity: s.capacity,
    fee_twd: s.fee_twd,
    status: s.status,
    confirmed_count: regCountMap[s.id] ?? 0,
    available_spots: s.capacity - (regCountMap[s.id] ?? 0),
    club_name: s.clubs.name,
    club_slug: s.clubs.slug,
  }));

  return { sessions: result, total: Number(total ?? 0), page };
}

export default async function PublicSessionsPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const { sessions, total, page } = await fetchSessions(searchParams);
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  function pageUrl(p: number) {
    const sp = new URLSearchParams();
    if (searchParams.q) sp.set("q", searchParams.q);
    sp.set("page", String(p));
    return `/sessions?${sp.toString()}`;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Page header */}
      <div className="border-b border-border/40 pb-6 space-y-3">
        <div className="inline-block px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-accent text-accent-foreground shadow-sm">
          場次目錄
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
          瀏覽場次
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl">
          探索附近的匹克球場次，找到合適的時段，立即報名上場。
        </p>
      </div>

      {/* Search bar */}
      <Suspense fallback={<div className="h-10 bg-secondary/50 animate-pulse rounded-xl" />}>
        <PublicSessionSearch />
      </Suspense>

      {/* Results count */}
      {total > 0 && (
        <p className="text-sm text-muted-foreground">共 {total} 個即將舉辦的場次</p>
      )}

      {/* Session grid */}
      {sessions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => {
            const isFull = session.available_spots <= 0;
            return (
              <Link key={session.id} href={`/sessions/${session.id}`}>
                <Card className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold leading-tight line-clamp-2">{session.title}</h3>
                      <Badge variant={isFull ? "destructive" : "secondary"} className="shrink-0">
                        {isFull ? "已額滿" : `${session.available_spots} 個名額`}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{session.club_name}</p>
                  </CardHeader>
                  <CardContent className="space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      {format(new Date(session.scheduled_start_at), "EEE, MMM d · h:mm a")}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{session.location_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {session.confirmed_count}/{session.capacity}
                      </div>
                      {session.fee_twd > 0 && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          NT${session.fee_twd}
                        </div>
                      )}
                      {session.fee_twd === 0 && (
                        <span className="text-xs font-medium text-green-600">免費</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 px-4 mt-8 bg-card rounded-3xl border border-dashed border-border/60">
          <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-primary" />
          </div>
          <p className="text-xl font-bold mb-2">找不到符合條件的場次。</p>
          <p className="text-muted-foreground max-w-sm mx-auto">
            試試調整搜尋條件，或前往社團頁面探索更多活動。
          </p>
          <Button asChild variant="outline" className="mt-6 rounded-full">
            <Link href="/clubs">探索社團</Link>
          </Button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          {page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageUrl(page - 1)}>← 上一頁</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>← 上一頁</Button>
          )}
          <span className="text-sm text-muted-foreground">
            第 {page} / {totalPages} 頁
          </span>
          {page < totalPages ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageUrl(page + 1)}>下一頁 →</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>下一頁 →</Button>
          )}
        </div>
      )}
    </div>
  );
}
