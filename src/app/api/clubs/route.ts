import { requireAuth, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";
import { CreateClubSchema } from "@/lib/validations/clubs";
import { trackEvent } from "@/lib/analytics";

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const body: unknown = await request.json();
  const parsed = CreateClubSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation error", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  // Check slug is unique
  const { data: existing } = await supabaseAdmin
    .from("clubs")
    .select("id")
    .eq("slug", parsed.data.slug)
    .single();

  if (existing) {
    return fail("Slug already taken", "SLUG_TAKEN", 409);
  }

  const { data: club, error } = await supabaseAdmin
    .from("clubs")
    .insert({ ...parsed.data, owner_user_id: auth.appUserId })
    .select()
    .single();

  if (error || !club) {
    return fail("Failed to create club", "DB_ERROR", 500);
  }

  // Auto-enroll owner as leader
  await supabaseAdmin.from("club_memberships").insert({
    club_id: club.id,
    user_id: auth.appUserId,
    role: "leader",
    status: "active",
  });

  await trackEvent("club_created", { user_id: auth.appUserId, club_id: club.id });

  return ok(club, 201);
}
