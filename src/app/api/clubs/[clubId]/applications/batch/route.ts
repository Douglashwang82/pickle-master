import { requireAuth, requireClubLeader, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail, parseJsonBody } from "@/lib/utils/api";
import { trackEvent } from "@/lib/analytics";
import { z } from "zod";

type Params = { params: Promise<{ clubId: string }> };

const BatchSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
  action: z.enum(["approve", "reject"]),
});

export async function POST(req: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { clubId } = await params;
  const guardError = await requireClubLeader(clubId, auth.appUserId);
  if (guardError) return guardError;

  const { body, error: parseError } = await parseJsonBody(req);
  if (parseError) return parseError;

  const parsed = BatchSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Invalid body", "INVALID_BODY", 400, parsed.error.flatten());
  }
  const { ids, action } = parsed.data;

  const { data: applications } = await supabaseAdmin
    .from("membership_applications")
    .select("id, user_id, status")
    .in("id", ids)
    .eq("club_id", clubId)
    .eq("status", "pending");

  const valid = applications ?? [];
  if (valid.length === 0) {
    return ok({ approved: 0, rejected: 0, skipped: ids.length });
  }

  const now = new Date().toISOString();

  if (action === "approve") {
    await supabaseAdmin
      .from("membership_applications")
      .update({
        status: "approved",
        reviewed_by: auth.appUserId,
        reviewed_at: now,
      })
      .in(
        "id",
        valid.map((a) => a.id)
      );

    const memberships = valid.map((a) => ({
      club_id: clubId,
      user_id: a.user_id,
      role: "member" as const,
      status: "active" as const,
      joined_at: now,
      removed_at: null,
    }));

    const { error: memberError } = await supabaseAdmin
      .from("club_memberships")
      .upsert(memberships, { onConflict: "club_id,user_id" });
    if (memberError) {
      return fail("Failed to add members", "DB_ERROR", 500);
    }

    const notifications = valid.map((a) => ({
      user_id: a.user_id,
      channel: "in_app" as const,
      type: "membership_approved" as const,
      payload_json: { club_id: clubId },
    }));
    await supabaseAdmin.from("notifications").insert(notifications);

    for (const a of valid) {
      await trackEvent("membership_approved", {
        user_id: a.user_id,
        club_id: clubId,
        batch: true,
      });
    }

    return ok({
      approved: valid.length,
      rejected: 0,
      skipped: ids.length - valid.length,
    });
  }

  // reject
  await supabaseAdmin
    .from("membership_applications")
    .update({
      status: "rejected",
      reviewed_by: auth.appUserId,
      reviewed_at: now,
    })
    .in(
      "id",
      valid.map((a) => a.id)
    );

  return ok({
    approved: 0,
    rejected: valid.length,
    skipped: ids.length - valid.length,
  });
}
