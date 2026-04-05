import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from("clubs")
    .select(
      `id, slug, name, description, sport_type, cover_image_url, public_status,
       club_memberships(count)`,
      { count: "exact" }
    )
    .eq("public_status", "public")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return fail("Failed to fetch clubs", "DB_ERROR", 500);
  }

  return ok({ clubs: data, total: count ?? 0, page, limit });
}
