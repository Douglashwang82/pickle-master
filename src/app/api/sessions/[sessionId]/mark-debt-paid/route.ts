import { requireAuth, requireClubLeader, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";
import { z } from "zod";

type Params = { params: Promise<{ sessionId: string }> };

const MarkDebtPaidSchema = z.object({
  userId: z.string().uuid(),
});

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { sessionId } = await params;

  const body: unknown = await request.json().catch(() => ({}));
  const parsed = MarkDebtPaidSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation error", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  const { userId } = parsed.data;

  // Fetch session + verify caller is a leader of the club
  const { data: session } = await supabaseAdmin
    .from("sessions")
    .select("id, club_id, title, fee_twd")
    .eq("id", sessionId)
    .single();

  if (!session) return fail("Session not found", "NOT_FOUND", 404);

  const leaderGuard = await requireClubLeader(session.club_id, auth.appUserId);
  if (leaderGuard) return leaderGuard;

  // Find the outstanding debt
  const { data: payment } = await supabaseAdmin
    .from("payment_transactions")
    .select("id, amount_twd")
    .eq("session_id", sessionId)
    .eq("payer_user_id", userId)
    .eq("status", "initiated")
    .single();

  if (!payment) {
    return fail("No outstanding debt found for this member", "NOT_FOUND", 404);
  }

  const now = new Date().toISOString();

  // Mark payment as succeeded (debt cleared)
  await supabaseAdmin
    .from("payment_transactions")
    .update({ status: "succeeded", settled_at: now, updated_at: now })
    .eq("id", payment.id);

  // Notify the member that their payment has been received
  await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    channel: "in_app",
    type: "payment_received",
    payload_json: {
      session_id: sessionId,
      session_title: session.title,
      amount_twd: payment.amount_twd,
      message: `Payment of NT$${payment.amount_twd} for "${session.title}" has been received. Thank you!`,
    },
  });

  return ok({ paid: true });
}
