import { requireAuth, requireClubLeader, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";
import { trackEvent } from "@/lib/analytics";

type Params = { params: Promise<{ clubId: string; applicationId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { clubId, applicationId } = await params;

  const guardError = await requireClubLeader(clubId, auth.appUserId);
  if (guardError) return guardError;

  const { data: application } = await supabaseAdmin
    .from("membership_applications")
    .select("*")
    .eq("id", applicationId)
    .eq("club_id", clubId)
    .eq("status", "pending")
    .single();

  if (!application) {
    return fail("Application not found or already reviewed", "NOT_FOUND", 404);
  }

  const now = new Date().toISOString();

  // Update application status
  await supabaseAdmin
    .from("membership_applications")
    .update({ status: "approved", reviewed_by: auth.appUserId, reviewed_at: now })
    .eq("id", applicationId);

  // Upsert club membership
  const { error: memberError } = await supabaseAdmin
    .from("club_memberships")
    .upsert(
      {
        club_id: clubId,
        user_id: application.user_id,
        role: "member",
        status: "active",
        joined_at: now,
        removed_at: null,
      },
      { onConflict: "club_id,user_id" }
    );

  if (memberError) {
    return fail("Failed to add member", "DB_ERROR", 500);
  }

  await trackEvent("membership_approved", {
    user_id: application.user_id,
    club_id: clubId,
  });

  // Queue welcome notification
  await supabaseAdmin.from("notifications").insert({
    user_id: application.user_id,
    channel: "in_app",
    type: "membership_approved",
    payload_json: { club_id: clubId },
  });

  return ok({ message: "Application approved" });
}
