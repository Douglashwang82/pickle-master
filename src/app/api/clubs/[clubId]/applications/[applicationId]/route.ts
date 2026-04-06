import { requireAuth, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";

type Params = { params: Promise<{ clubId: string; applicationId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { clubId, applicationId } = await params;

  // Verify the application belongs to the user
  const { data: application } = await supabaseAdmin
    .from("membership_applications")
    .select("id, user_id, status")
    .eq("id", applicationId)
    .eq("club_id", clubId)
    .single();

  if (!application) {
    return fail("Application not found", "NOT_FOUND", 404);
  }

  if (application.user_id !== auth.appUserId) {
    return fail("Unauthorized", "UNAUTHORIZED", 403);
  }

  // Allow deleting pending or rejected. If approved, they should leave the club instead.
  if (application.status === "approved") {
    return fail("Cannot cancel approved application", "BAD_REQUEST", 400);
  }

  const { error } = await supabaseAdmin
    .from("membership_applications")
    .delete()
    .eq("id", applicationId);

  if (error) {
    return fail("Failed to cancel application", "DB_ERROR", 500);
  }

  return ok({ message: "Application cancelled" });
}
