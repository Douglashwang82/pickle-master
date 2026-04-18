import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";

type Params = { params: Promise<{ token: string }> };

// GET /api/invite/[token] — public: resolve token to club preview info
export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;

  const { data: link } = await supabaseAdmin
    .from("club_invite_links")
    .select("id, club_id, use_count, expires_at, max_uses, is_active")
    .eq("token", token)
    .single();

  if (!link) return fail("Invite link not found", "NOT_FOUND", 404);
  if (!link.is_active) return fail("Invite link is no longer active", "LINK_INACTIVE", 410);
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return fail("Invite link has expired", "LINK_EXPIRED", 410);
  }
  if (link.max_uses !== null && link.use_count >= link.max_uses) {
    return fail("Invite link has reached its use limit", "LINK_EXHAUSTED", 410);
  }

  // Fetch club preview
  const { data: club } = await supabaseAdmin
    .from("clubs")
    .select("id, slug, name, description, cover_image_url, public_status, status, membership_type")
    .eq("id", link.club_id)
    .eq("status", "active")
    .single();

  if (!club) return fail("Club not found", "NOT_FOUND", 404);

  // Member count
  const { count: memberCount } = await supabaseAdmin
    .from("club_memberships")
    .select("*", { count: "exact", head: true })
    .eq("club_id", club.id)
    .eq("status", "active");

  return ok({
    token,
    club: { ...club, member_count: memberCount ?? 0 },
  });
}
