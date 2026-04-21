import { Suspense } from "react";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ClubCard from "@/components/clubs/ClubCard";
import ClubFilterBar from "@/components/clubs/ClubFilterBar";
import ClubMapLoader from "@/components/clubs/ClubMapLoader";
import { ArrowRight, Compass, Plus } from "lucide-react";
import type { ClubWithDiscovery } from "@/types/domain";
import { PublicClubsQuerySchema } from "@/lib/validations/clubs";

export const dynamic = "force-dynamic";

const LIMIT = 20;

type SearchParams = {
  q?: string;
  district?: string;
  membership?: string;
  skill?: string;
  lat?: string;
  lng?: string;
  radius_km?: string;
  sort?: string;
  view?: string;
  page?: string;
};

async function fetchClubs(sp: SearchParams): Promise<{
  clubs: ClubWithDiscovery[];
  total: number;
  page: number;
}> {
  const parsed = PublicClubsQuerySchema.safeParse({
    q:         sp.q,
    district:  sp.district,
    membership: sp.membership,
    skill:     sp.skill,
    lat:       sp.lat,
    lng:       sp.lng,
    radius_km: sp.radius_km,
    sort:      sp.sort,
    view:      sp.view,
    page:      sp.page,
  });

  const {
    q, district, membership, skill, lat, lng, radius_km, sort, page,
  } = parsed.success
    ? parsed.data
    : { q: undefined, district: undefined, membership: undefined,
        skill: undefined, lat: undefined, lng: undefined,
        radius_km: 5, sort: "newest" as const, page: 1 };

  const offset = (page - 1) * LIMIT;

  const [{ data: clubs }, { data: total }] = await Promise.all([
    supabaseAdmin.rpc("get_public_clubs", {
      p_search:     q        ?? null,
      p_district:   district ?? null,
      p_membership: membership ?? null,
      p_skill:      skill    ?? null,
      p_lat:        lat      ?? null,
      p_lng:        lng      ?? null,
      p_radius_km:  radius_km,
      p_sort:       sort,
      p_limit:      LIMIT,
      p_offset:     offset,
    }),
    supabaseAdmin.rpc("count_public_clubs", {
      p_search:     q        ?? null,
      p_district:   district ?? null,
      p_membership: membership ?? null,
      p_skill:      skill    ?? null,
      p_lat:        lat      ?? null,
      p_lng:        lng      ?? null,
      p_radius_km:  radius_km,
    }),
  ]);

  return {
    clubs: (clubs ?? []) as ClubWithDiscovery[],
    total: Number(total ?? 0),
    page,
  };
}

export default async function PublicClubsPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;

  // Resolve view before fetching so we can pass it as a prop
  const view = searchParams.view === "map" ? "map" : "list";

  const { clubs, total, page } = await fetchClubs(searchParams);
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const userLat = searchParams.lat ? parseFloat(searchParams.lat) : undefined;
  const userLng = searchParams.lng ? parseFloat(searchParams.lng) : undefined;

  function pageUrl(p: number) {
    const sp = new URLSearchParams();
    if (searchParams.q)          sp.set("q",          searchParams.q);
    if (searchParams.district)   sp.set("district",   searchParams.district);
    if (searchParams.membership) sp.set("membership", searchParams.membership);
    if (searchParams.skill)      sp.set("skill",      searchParams.skill);
    if (searchParams.lat)        sp.set("lat",        searchParams.lat);
    if (searchParams.lng)        sp.set("lng",        searchParams.lng);
    if (searchParams.radius_km)  sp.set("radius_km",  searchParams.radius_km);
    if (searchParams.sort)       sp.set("sort",       searchParams.sort);
    sp.set("view", view);
    sp.set("page", String(p));
    return `/clubs?${sp.toString()}`;
  }

  return (
    <div className="relative space-y-8 animate-in fade-in duration-500">
      <section className="relative overflow-hidden rounded-[2.2rem] border border-border/70 bg-card/85 px-6 py-8 shadow-[0_30px_110px_-60px_rgba(16,42,31,0.5)] backdrop-blur-sm md:px-8 md:py-10">
        <div className="pointer-events-none absolute right-[-5rem] top-[-4rem] h-56 w-56 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute left-[-6rem] bottom-[-5rem] h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center rounded-full bg-accent px-4 py-1.5 text-[0.7rem] font-black uppercase tracking-[0.22em] text-accent-foreground shadow-sm">
              社團目錄
            </div>
            <h1 className="text-4xl font-black tracking-tight text-foreground md:text-5xl lg:text-6xl">
              用更清楚的節奏，找到你的球友圈。
            </h1>
            <p className="max-w-xl text-base leading-8 text-muted-foreground md:text-lg">
              瀏覽公開社團、比較加入方式與活動密度，先看見氛圍與標準，再決定哪個社群最適合你。
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Card className="rounded-[1.5rem] border-border/70 bg-background/80 shadow-none">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-primary/70">探索狀態</p>
                  <p className="text-sm font-semibold text-foreground">{total > 0 ? `目前共有 ${total} 個公開社團` : "開始找下一個固定球團"}</p>
                </div>
              </CardContent>
            </Card>
            <Button asChild className="h-auto rounded-full px-6 py-4 font-bold shadow-sm md:w-auto w-full group">
              <Link href="/clubs/new">
                <Plus className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
                創建社團
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border/70 bg-background/80 p-4 shadow-[0_24px_80px_-60px_rgba(16,42,31,0.45)] backdrop-blur-sm md:p-5">
        <Suspense fallback={<div className="h-12 rounded-2xl bg-secondary/50 animate-pulse" />}>
          <ClubFilterBar view={view} />
        </Suspense>
      </section>

      {total > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">共 {total} 個社團</p>
          <Link href="/sessions" className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80">
            也看看近期場次
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Map view */}
      {view === "map" && (
        <ClubMapLoader
          clubs={clubs}
          userLat={userLat}
          userLng={userLng}
        />
      )}

      {/* List view */}
      {view === "list" && (
        <>
          {clubs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {clubs.map((club) => (
                <ClubCard key={club.id} club={club} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-[2rem] border border-dashed border-border/60 bg-card/90 px-4 py-20 text-center shadow-[0_24px_80px_-60px_rgba(16,42,31,0.45)]">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <p className="text-xl font-bold mb-2">找不到符合條件的社團。</p>
              <p className="text-muted-foreground max-w-sm mx-auto">
                試試調整篩選條件，或成為第一個在您所在地區創建匹克球社團的人！
              </p>
            </div>
          )}
        </>
      )}

      {/* Pagination (list view only) */}
      {view === "list" && totalPages > 1 && (
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
