import { requireAuth, requireClubLeader, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";

type Params = { params: Promise<{ clubId: string; applicationId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { clubId, applicationId } = await params;

  const guardError = await requireClubLeader(clubId, auth.appUserId);
  if (guardError) return guardError;

  const { data: application } = await supabaseAdmin
    .from("membership_applications")
    .select("id")
    .eq("id", applicationId)
    .eq("club_id", clubId)
    .eq("status", "pending")
    .single();

  if (!application) {
    return fail("Application not found or already reviewed", "NOT_FOUND", 404);
  }

  const now = new Date().toISOString();

  await supabaseAdmin
    .from("membership_applications")
    .update({ status: "rejected", reviewed_by: auth.appUserId, reviewed_at: now })
    .eq("id", applicationId);

  return ok({ message: "Application rejected" });
}
