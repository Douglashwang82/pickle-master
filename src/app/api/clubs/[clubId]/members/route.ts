import { requireAuth, requireClubMember, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";

type Params = { params: Promise<{ clubId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { clubId } = await params;

  const guardError = await requireClubMember(clubId, auth.appUserId);
  if (guardError) return guardError;

  const { data: memberships, error } = await supabaseAdmin
    .from("club_memberships")
    .select("id, role, status, user_id, joined_at, removed_at")
    .eq("club_id", clubId)
    .in("status", ["active", "pending"])
    .order("joined_at", { ascending: true });

  if (error) return fail("Failed to fetch members", "DB_ERROR", 500);

  const userIds = (memberships ?? []).map((m) => m.user_id);
  const { data: profiles } = userIds.length
    ? await supabaseAdmin
        .from("profiles")
        .select("user_id, display_name, photo_url, skill_level")
        .in("user_id", userIds)
    : { data: [] };

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p]));

  const result = (memberships ?? []).map((m) => ({
    ...m,
    profile: profileMap[m.user_id] ?? null,
  }));

  return ok(result);
}
