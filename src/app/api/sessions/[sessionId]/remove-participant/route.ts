import { requireAuth, requireClubLeader, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail, parseJsonBody } from "@/lib/utils/api";
import { z } from "zod";
import { initiateRefund } from "@/lib/payment/client";
import { sessionStatusAfterRegistration } from "@/lib/state-machines/session";
import type { SessionStatus } from "@/types/domain";
import { promoteNextWaitlistedMember } from "@/lib/waitlist";

type Params = { params: Promise<{ sessionId: string }> };

const Schema = z.object({ userId: z.string().uuid() });

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { sessionId } = await params;

  const { body, error: jsonError } = await parseJsonBody(request);
  if (jsonError) return jsonError;

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation error", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  const { data: session } = await supabaseAdmin
    .from("sessions")
    .select("id, club_id, title, status, capacity, fee_twd")
    .eq("id", sessionId)
    .single();

  if (!session) return fail("Session not found", "NOT_FOUND", 404);

  const guardError = await requireClubLeader(session.club_id, auth.appUserId);
  if (guardError) return guardError;

  const { data: registration } = await supabaseAdmin
    .from("session_registrations")
    .select("id, status, payment_transaction_id")
    .eq("session_id", sessionId)
    .eq("user_id", parsed.data.userId)
    .in("status", ["confirmed"])
    .single();

  if (!registration) return fail("Participant not found or not confirmed", "NOT_FOUND", 404);

  const now = new Date().toISOString();

  // Initiate refund if there's a payment
  if (registration.payment_transaction_id) {
    const { data: payment } = await supabaseAdmin
      .from("payment_transactions")
      .select("id, gateway_payment_id, amount_twd, status")
      .eq("id", registration.payment_transaction_id)
      .single();

    if (payment && payment.status === "succeeded" && payment.gateway_payment_id) {
      await initiateRefund(payment.gateway_payment_id, payment.amount_twd);

      await supabaseAdmin.from("refund_transactions").insert({
        payment_transaction_id: payment.id,
        amount_twd: payment.amount_twd,
        reason: "participant_removed",
        status: "succeeded",
        gateway_refund_id: `mock_refund_${Date.now()}`,
      });

      await supabaseAdmin
        .from("payment_transactions")
        .update({ status: "refunded", updated_at: now })
        .eq("id", payment.id);
    }
  }

  // Update registration to removed + refunded
  await supabaseAdmin
    .from("session_registrations")
    .update({ status: "refunded", cancelled_at: now })
    .eq("id", registration.id);

  // Recount and update session status
  const { count } = await supabaseAdmin
    .from("session_registrations")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("status", "confirmed");

  const promoted = await promoteNextWaitlistedMember(
    {
      id: session.id,
      club_id: session.club_id,
      title: session.title,
      status: session.status as SessionStatus,
      capacity: session.capacity,
      fee_twd: session.fee_twd,
    },
    now
  );

  const finalConfirmedCount = promoted ? (count ?? 0) + 1 : count ?? 0;
  const newStatus = promoted?.newStatus ?? sessionStatusAfterRegistration(
    session.status as SessionStatus,
    finalConfirmedCount,
    session.capacity
  );

  if (newStatus !== session.status) {
    await supabaseAdmin
      .from("sessions")
      .update({ status: newStatus, updated_at: now })
      .eq("id", sessionId);
  }

  // Notify the removed participant
  await supabaseAdmin.from("notifications").insert({
    user_id: parsed.data.userId,
    channel: "in_app",
    type: "removed_from_session",
    payload_json: { session_id: sessionId },
  });

  return ok({ message: "Participant removed and refunded" });
}
