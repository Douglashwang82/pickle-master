import { requireAuth, requireClubMember, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";
import { JoinSessionSchema } from "@/lib/validations/payments";
import { initiatePayment } from "@/lib/payment/client";
import { sessionStatusAfterRegistration } from "@/lib/state-machines/session";
import { trackEvent } from "@/lib/analytics";
import type { SessionStatus } from "@/types/domain";

type Params = { params: Promise<{ sessionId: string }> };

const BOOKING_HOLD_MINUTES = 15;
const PLATFORM_FEE_RATE = 0.05;

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { sessionId } = await params;

  // Validate request body
  const body: unknown = await request.json().catch(() => ({}));
  const parsed = JoinSessionSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation error", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  // Fetch session
  const { data: session } = await supabaseAdmin
    .from("sessions")
    .select("id, club_id, status, capacity, fee_twd")
    .eq("id", sessionId)
    .single();

  if (!session) return fail("Session not found", "NOT_FOUND", 404);

  if (!["published", "full"].includes(session.status)) {
    return fail(
      `Cannot join a session with status '${session.status}'`,
      "SESSION_NOT_JOINABLE",
      409
    );
  }

  // Membership check
  const memberGuard = await requireClubMember(session.club_id, auth.appUserId);
  if (memberGuard) return memberGuard;

  // Check for existing active registration
  const { data: existingReg } = await supabaseAdmin
    .from("session_registrations")
    .select("id, status")
    .eq("session_id", sessionId)
    .eq("user_id", auth.appUserId)
    .in("status", ["confirmed", "payment_pending"])
    .single();

  if (existingReg) {
    return fail("Already registered for this session", "ALREADY_REGISTERED", 409);
  }

  // Check capacity — count confirmed registrations
  const { count: confirmedCount } = await supabaseAdmin
    .from("session_registrations")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("status", "confirmed");

  if ((confirmedCount ?? 0) >= session.capacity) {
    return fail("Session is full", "SESSION_FULL", 409);
  }

  const now = new Date();
  const holdExpiry = new Date(now.getTime() + BOOKING_HOLD_MINUTES * 60 * 1000).toISOString();

  // Create payment_pending registration
  const { data: registration, error: regError } = await supabaseAdmin
    .from("session_registrations")
    .insert({
      session_id: sessionId,
      user_id: auth.appUserId,
      status: "payment_pending",
      booking_hold_expires_at: holdExpiry,
    })
    .select()
    .single();

  if (regError || !registration) {
    return fail("Failed to create registration", "DB_ERROR", 500);
  }

  // Create payment transaction record
  const platformFee = Math.round(session.fee_twd * PLATFORM_FEE_RATE);
  const netAmount = session.fee_twd - platformFee;

  const { data: payment, error: payError } = await supabaseAdmin
    .from("payment_transactions")
    .insert({
      session_id: sessionId,
      registration_id: registration.id,
      club_id: session.club_id,
      payer_user_id: auth.appUserId,
      gateway: "mock",
      amount_twd: session.fee_twd,
      platform_fee_twd: platformFee,
      net_amount_twd: netAmount,
      status: "initiated",
    })
    .select()
    .single();

  if (payError || !payment) {
    // Roll back registration
    await supabaseAdmin
      .from("session_registrations")
      .delete()
      .eq("id", registration.id);
    return fail("Failed to initiate payment", "DB_ERROR", 500);
  }

  await trackEvent("payment_initiated", {
    user_id: auth.appUserId,
    session_id: sessionId,
    club_id: session.club_id,
    amount: session.fee_twd,
    method: "mock",
  });

  // Simulate payment failure if requested (dev only)
  if (parsed.data.simulateFailure) {
    await supabaseAdmin
      .from("session_registrations")
      .update({ status: "cancelled", cancelled_at: now.toISOString() })
      .eq("id", registration.id);

    await supabaseAdmin
      .from("payment_transactions")
      .update({
        status: "failed",
        failure_code: "MOCK_FAILURE",
        failure_message: "Simulated payment failure",
        updated_at: now.toISOString(),
      })
      .eq("id", payment.id);

    await trackEvent("payment_failed", {
      user_id: auth.appUserId,
      session_id: sessionId,
      club_id: session.club_id,
      error_code: "MOCK_FAILURE",
      method: "mock",
    });

    return fail("Payment failed (simulated)", "PAYMENT_FAILED", 402);
  }

  // Process mock payment
  const paymentResult = await initiatePayment(session.fee_twd, registration.id);

  // Confirm: update payment + registration
  const nowStr = now.toISOString();
  await supabaseAdmin
    .from("payment_transactions")
    .update({
      status: "succeeded",
      gateway_payment_id: paymentResult.gatewayPaymentId,
      settled_at: nowStr,
      updated_at: nowStr,
    })
    .eq("id", payment.id);

  await supabaseAdmin
    .from("session_registrations")
    .update({
      status: "confirmed",
      payment_transaction_id: payment.id,
    })
    .eq("id", registration.id);

  // Update session status if now full
  const newConfirmedCount = (confirmedCount ?? 0) + 1;
  const newStatus = sessionStatusAfterRegistration(
    session.status as SessionStatus,
    newConfirmedCount,
    session.capacity
  );

  if (newStatus !== session.status) {
    await supabaseAdmin
      .from("sessions")
      .update({ status: newStatus, updated_at: nowStr })
      .eq("id", sessionId);
  }

  await trackEvent("payment_success", {
    user_id: auth.appUserId,
    session_id: sessionId,
    club_id: session.club_id,
    amount: session.fee_twd,
    method: "mock",
  });

  // Send confirmation notification
  await supabaseAdmin.from("notifications").insert({
    user_id: auth.appUserId,
    channel: "in_app",
    type: "session_joined",
    payload_json: {
      session_id: sessionId,
      gateway_payment_id: paymentResult.gatewayPaymentId,
    },
  });

  return ok({
    registration_id: registration.id,
    confirmed: true,
    booking_hold_expires_at: holdExpiry,
  });
}
