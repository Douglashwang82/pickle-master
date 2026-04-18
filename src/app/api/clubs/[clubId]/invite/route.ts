import { requireAuth, requireClubLeader, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";
import { trackEvent } from "@/lib/analytics";
import { randomBytes } from "crypto";

type Params = { params: Promise<{ clubId: string }> };

function generateToken(): string {
  return randomBytes(16).toString("hex");
}

// POST /api/clubs/[clubId]/invite — generate (or regenerate) an invite link
export async function POST(_req: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { clubId } = await params;

  const guardError = await requireClubLeader(clubId, auth.appUserId);
  if (guardError) return guardError;

  // Deactivate any existing active links for this club
  await supabaseAdmin
    .from("club_invite_links")
    .update({ is_active: false })
    .eq("club_id", clubId)
    .eq("is_active", true);

  // Create new link
  const token = generateToken();
  const { data: link, error } = await supabaseAdmin
    .from("club_invite_links")
    .insert({
      club_id: clubId,
      token,
      created_by: auth.appUserId,
    })
    .select()
    .single();

  if (error || !link) {
    return fail("Failed to create invite link", "DB_ERROR", 500);
  }

  await trackEvent("invite_link_created", { user_id: auth.appUserId, club_id: clubId });

  return ok(link, 201);
}

// DELETE /api/clubs/[clubId]/invite — revoke the active invite link
export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { clubId } = await params;

  const guardError = await requireClubLeader(clubId, auth.appUserId);
  if (guardError) return guardError;

  const { error } = await supabaseAdmin
    .from("club_invite_links")
    .update({ is_active: false })
    .eq("club_id", clubId)
    .eq("is_active", true);

  if (error) {
    return fail("Failed to revoke invite link", "DB_ERROR", 500);
  }

  await trackEvent("invite_link_revoked", { user_id: auth.appUserId, club_id: clubId });

  return ok({ revoked: true });
}

// GET /api/clubs/[clubId]/invite — get the active invite link for this club (leader only)
export async function GET(_req: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { clubId } = await params;

  const guardError = await requireClubLeader(clubId, auth.appUserId);
  if (guardError) return guardError;

  const { data: link } = await supabaseAdmin
    .from("club_invite_links")
    .select("id, token, use_count, created_at, expires_at")
    .eq("club_id", clubId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return ok(link ?? null);
}
