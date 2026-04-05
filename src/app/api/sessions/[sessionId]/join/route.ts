import { requireAuth, requireClubMember, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";
import { JoinSessionSchema } from "@/lib/validations/payments";
import { sessionStatusAfterRegistration } from "@/lib/state-machines/session";
import { trackEvent } from "@/lib/analytics";
import type { SessionStatus } from "@/types/domain";

type Params = { params: Promise<{ sessionId: string }> };

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
  const nowStr = now.toISOString();

  // Create confirmed registration immediately (payment tracked as debt)
  const { data: registration, error: regError } = await supabaseAdmin
    .from("session_registrations")
    .insert({
      session_id: sessionId,
      user_id: auth.appUserId,
      status: "confirmed",
      joined_at: nowStr,
    })
    .select()
    .single();

  if (regError || !registration) {
    return fail("Failed to create registration", "DB_ERROR", 500);
  }

  // Create payment transaction as 'initiated' — this represents the outstanding debt
  const platformFee = Math.round(session.fee_twd * PLATFORM_FEE_RATE);
  const netAmount = session.fee_twd - platformFee;

  const { data: payment, error: payError } = await supabaseAdmin
    .from("payment_transactions")
    .insert({
      session_id: sessionId,
      registration_id: registration.id,
      club_id: session.club_id,
      payer_user_id: auth.appUserId,
      gateway: "manual",
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
    return fail("Failed to create debt record", "DB_ERROR", 500);
  }

  // Link payment record to registration
  await supabaseAdmin
    .from("session_registrations")
    .update({ payment_transaction_id: payment.id })
    .eq("id", registration.id);

  await trackEvent("payment_initiated", {
    user_id: auth.appUserId,
    session_id: sessionId,
    club_id: session.club_id,
    amount: session.fee_twd,
    method: "manual",
  });

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

  // Notify member: registration confirmed, payment outstanding
  await supabaseAdmin.from("notifications").insert({
    user_id: auth.appUserId,
    channel: "in_app",
    type: "session_joined",
    payload_json: {
      session_id: sessionId,
      amount_twd: session.fee_twd,
      message: `You have joined the session. Please pay NT$${session.fee_twd} to the club leader.`,
    },
  });

  return ok({
    registration_id: registration.id,
    payment_transaction_id: payment.id,
    confirmed: true,
    debt_amount_twd: session.fee_twd,
  });
}
