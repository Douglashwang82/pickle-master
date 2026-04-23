import { Suspense } from "react";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ArrowRight, Calendar, DollarSign, MapPin, Search, Sparkles, Users } from "lucide-react";
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
  image_url: string | null;
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
      location_name, image_url, capacity, fee_twd, status,
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
      image_url: string | null;
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
    image_url: s.image_url,
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
    <div className="relative space-y-8 animate-in fade-in duration-500">
      <section className="relative overflow-hidden rounded-[2.2rem] border border-border/70 bg-card/85 px-6 py-8 shadow-[0_30px_110px_-60px_rgba(16,42,31,0.5)] backdrop-blur-sm md:px-8 md:py-10">
        <div className="pointer-events-none absolute right-[-5rem] top-[-4rem] h-56 w-56 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute left-[-6rem] bottom-[-5rem] h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center rounded-full bg-accent px-4 py-1.5 text-[0.7rem] font-black uppercase tracking-[0.22em] text-accent-foreground shadow-sm">
              場次目錄
            </div>
            <h1 className="text-4xl font-black tracking-tight text-foreground md:text-5xl lg:text-6xl">
              先看節奏，再決定要上哪一場。
            </h1>
            <p className="max-w-xl text-base leading-8 text-muted-foreground md:text-lg">
              瀏覽即將舉辦的場次、查看名額與費用，把你要加入的那一場看清楚之後再出手。
            </p>
          </div>

          <Card className="rounded-[1.5rem] border-border/70 bg-background/80 shadow-none">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-primary/70">即將開打</p>
                <p className="text-sm font-semibold text-foreground">{total > 0 ? `共有 ${total} 場公開可瀏覽的場次` : "目前沒有符合條件的場次"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border/70 bg-background/80 p-4 shadow-[0_24px_80px_-60px_rgba(16,42,31,0.45)] backdrop-blur-sm md:p-5">
        <Suspense fallback={<div className="h-12 rounded-2xl bg-secondary/50 animate-pulse" />}>
          <PublicSessionSearch />
        </Suspense>
      </section>

      {/* Results count */}
      {total > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">共 {total} 個即將舉辦的場次</p>
          <Link href="/clubs" className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80">
            回到社團探索
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Session grid */}
      {sessions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => {
            const isFull = session.available_spots <= 0;
            return (
              <Link key={session.id} href={`/sessions/${session.id}`}>
                <Card className="h-full cursor-pointer overflow-hidden rounded-[1.7rem] border-border/70 bg-card/90 transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_24px_80px_-52px_rgba(16,42,31,0.45)]">
                  {session.image_url && (
                    <div className="aspect-[16/8] w-full bg-muted">
                      <img
                        src={session.image_url}
                        alt={session.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold leading-tight line-clamp-2 text-lg">{session.title}</h3>
                      <Badge variant={isFull ? "destructive" : "secondary"} className="shrink-0 rounded-full">
                        {isFull ? "已額滿" : `${session.available_spots} 個名額`}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">{session.club_name}</p>
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
        <div className="mt-8 rounded-[2rem] border border-dashed border-border/60 bg-card/90 px-4 py-20 text-center shadow-[0_24px_80px_-60px_rgba(16,42,31,0.45)]">
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
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href={pageUrl(page - 1)}>← 上一頁</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="rounded-full" disabled>← 上一頁</Button>
          )}
          <span className="text-sm text-muted-foreground">
            第 {page} / {totalPages} 頁
          </span>
          {page < totalPages ? (
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href={pageUrl(page + 1)}>下一頁 →</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="rounded-full" disabled>下一頁 →</Button>
          )}
        </div>
      )}
    </div>
  );
}
