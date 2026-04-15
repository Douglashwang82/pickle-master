import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";
import { PublicClubsQuerySchema } from "@/lib/validations/clubs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parsed = PublicClubsQuerySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    district: searchParams.get("district") ?? undefined,
    membership: searchParams.get("membership") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    page: searchParams.get("page") ?? undefined,
  });

  if (!parsed.success) {
    return fail("Invalid query parameters", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  const { q, district, membership, sort, page } = parsed.data;
  const limit = 20;
  const offset = (page - 1) * limit;

  const [{ data: clubs, error }, { data: totalRow, error: countError }] =
    await Promise.all([
      supabaseAdmin.rpc("get_public_clubs", {
        p_search: q ?? null,
        p_district: district ?? null,
        p_membership: membership ?? null,
        p_sort: sort,
        p_limit: limit,
        p_offset: offset,
      }),
      supabaseAdmin.rpc("count_public_clubs", {
        p_search: q ?? null,
        p_district: district ?? null,
        p_membership: membership ?? null,
      }),
    ]);

  if (error || countError) {
    return fail("Failed to fetch clubs", "DB_ERROR", 500);
  }

  return ok({ clubs: clubs ?? [], total: Number(totalRow ?? 0), page, limit });
}
