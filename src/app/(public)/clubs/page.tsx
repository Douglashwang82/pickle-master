import { Suspense } from "react";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/db";
import { Button } from "@/components/ui/button";
import ClubCard from "@/components/clubs/ClubCard";
import ClubFilterBar from "@/components/clubs/ClubFilterBar";
import { Plus } from "lucide-react";
import type { ClubWithDiscovery } from "@/types/domain";
import { PublicClubsQuerySchema } from "@/lib/validations/clubs";

export const dynamic = "force-dynamic";

const LIMIT = 20;

type SearchParams = {
  q?: string;
  district?: string;
  membership?: string;
  sort?: string;
  page?: string;
};

async function fetchClubs(searchParams: SearchParams): Promise<{
  clubs: ClubWithDiscovery[];
  total: number;
  page: number;
}> {
  const parsed = PublicClubsQuerySchema.safeParse({
    q: searchParams.q,
    district: searchParams.district,
    membership: searchParams.membership,
    sort: searchParams.sort,
    page: searchParams.page,
  });

  const { q, district, membership, sort, page } = parsed.success
    ? parsed.data
    : { q: undefined, district: undefined, membership: undefined, sort: "newest" as const, page: 1 };

  const offset = (page - 1) * LIMIT;

  const [{ data: clubs }, { data: total }] = await Promise.all([
    supabaseAdmin.rpc("get_public_clubs", {
      p_search: q ?? null,
      p_district: district ?? null,
      p_membership: membership ?? null,
      p_sort: sort,
      p_limit: LIMIT,
      p_offset: offset,
    }),
    supabaseAdmin.rpc("count_public_clubs", {
      p_search: q ?? null,
      p_district: district ?? null,
      p_membership: membership ?? null,
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
  const { clubs, total, page } = await fetchClubs(searchParams);
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  function pageUrl(p: number) {
    const sp = new URLSearchParams();
    if (searchParams.q) sp.set("q", searchParams.q);
    if (searchParams.district) sp.set("district", searchParams.district);
    if (searchParams.membership) sp.set("membership", searchParams.membership);
    if (searchParams.sort) sp.set("sort", searchParams.sort);
    sp.set("page", String(p));
    return `/clubs?${sp.toString()}`;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border/40 pb-6 gap-4">
        <div className="space-y-3">
          <div className="inline-block px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-accent text-accent-foreground shadow-sm">
            社團目錄
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">探索社團</h1>
          <p className="text-muted-foreground text-lg max-w-xl">找到您的球友圈，一起上場。加入現有社團或創建您自己的社團。</p>
        </div>
        <Button asChild className="rounded-full font-bold shadow-sm md:w-auto w-full group py-6 px-6">
          <Link href="/login">
            <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
            創建社團
          </Link>
        </Button>
      </div>

      {/* Filter bar (Client Component wrapped in Suspense for useSearchParams) */}
      <Suspense fallback={null}>
        <ClubFilterBar />
      </Suspense>

      {/* Results count */}
      {total > 0 && (
        <p className="text-sm text-muted-foreground">
          共 {total} 個社團
        </p>
      )}

      {/* Club grid */}
      {clubs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {clubs.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-4 mt-8 bg-card rounded-3xl border border-dashed border-border/60">
          <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <p className="text-xl font-bold mb-2">找不到符合條件的社團。</p>
          <p className="text-muted-foreground max-w-sm mx-auto">試試調整篩選條件，或成為第一個在您所在地區創建匹克球社團的人！</p>
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
