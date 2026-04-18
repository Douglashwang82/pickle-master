import { requireAuth, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";
import { trackEvent } from "@/lib/analytics";

type Params = { params: Promise<{ token: string }> };

// POST /api/invite/[token]/join — authenticated: join or apply to club via invite token
export async function POST(_req: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { token } = await params;

  // Resolve and validate token
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

  const clubId = link.club_id;

  // Fetch club
  const { data: club } = await supabaseAdmin
    .from("clubs")
    .select("id, membership_type, status")
    .eq("id", clubId)
    .eq("status", "active")
    .single();

  if (!club) return fail("Club not found", "NOT_FOUND", 404);

  // Check existing membership
  const { data: existing } = await supabaseAdmin
    .from("club_memberships")
    .select("id, status")
    .eq("club_id", clubId)
    .eq("user_id", auth.appUserId)
    .single();

  if (existing?.status === "active") {
    return fail("Already a member", "ALREADY_MEMBER", 409);
  }

  // Increment use count
  await supabaseAdmin
    .from("club_invite_links")
    .update({ use_count: link.use_count + 1 })
    .eq("id", link.id);

  // Open-join: grant membership immediately
  if (club.membership_type === "open") {
    const { data: membership, error: memberError } = await supabaseAdmin
      .from("club_memberships")
      .upsert(
        {
          club_id: clubId,
          user_id: auth.appUserId,
          role: "member",
          status: "active",
        },
        { onConflict: "club_id,user_id" }
      )
      .select()
      .single();

    if (memberError || !membership) {
      return fail("Failed to join club", "DB_ERROR", 500);
    }

    await trackEvent("membership_joined_via_invite", {
      user_id: auth.appUserId,
      club_id: clubId,
      token,
    });

    return ok({ type: "joined", membership }, 201);
  }

  // Application-based: check for existing pending application
  const { data: existingApp } = await supabaseAdmin
    .from("membership_applications")
    .select("id")
    .eq("club_id", clubId)
    .eq("user_id", auth.appUserId)
    .eq("status", "pending")
    .single();

  if (existingApp) {
    return fail("Application already pending", "APPLICATION_PENDING", 409);
  }

  const { data: application, error } = await supabaseAdmin
    .from("membership_applications")
    .insert({
      club_id: clubId,
      user_id: auth.appUserId,
    })
    .select()
    .single();

  if (error || !application) {
    return fail("Failed to submit application", "DB_ERROR", 500);
  }

  await trackEvent("membership_applied_via_invite", {
    user_id: auth.appUserId,
    club_id: clubId,
    token,
  });

  return ok({ type: "applied", application }, 201);
}
