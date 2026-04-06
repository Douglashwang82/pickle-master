import { requireAuth, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";

export async function GET() {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*, profiles(*)")
    .eq("id", auth.appUserId)
    .single();

  if (error || !data) {
    return fail("User not found", "USER_NOT_FOUND", 404);
  }

  const { data: reviewsData } = await (supabaseAdmin as any)
    .from("peer_reviews")
    .select(`
      rating,
      badges,
      created_at,
      reviewer_user_id,
      reviewer:users!reviewer_user_id(
        profiles(
          display_name
        )
      )
    `)
    .eq("reviewee_user_id", auth.appUserId)
    .order("created_at", { ascending: false });

  return ok({
    ...data,
    peer_reviews: reviewsData || [],
  });
}
