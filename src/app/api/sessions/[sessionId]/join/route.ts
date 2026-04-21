import { requireAuth, requireClubMember, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail, parseJsonBody } from "@/lib/utils/api";
import { JoinSessionSchema } from "@/lib/validations/payments";
import { trackEvent } from "@/lib/analytics";
import { createConfirmedRegistrationWithDebt } from "@/lib/session-registration";
import type { SessionStatus } from "@/types/domain";

type Params = { params: Promise<{ sessionId: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { sessionId } = await params;

  // Validate request body
  const { body, error: jsonError } = await parseJsonBody(request);
  if (jsonError) return jsonError;

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

  let registrationResult;
  try {
    registrationResult = await createConfirmedRegistrationWithDebt(
      {
        id: session.id,
        club_id: session.club_id,
        status: session.status as SessionStatus,
        capacity: session.capacity,
        fee_twd: session.fee_twd,
      },
      auth.appUserId,
      nowStr
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("SESSION_FULL")) {
      return fail("Session is full", "SESSION_FULL", 409);
    }
    if (message.includes("ALREADY_REGISTERED")) {
      return fail("Already registered for this session", "ALREADY_REGISTERED", 409);
    }
    if (message.includes("SESSION_NOT_JOINABLE")) {
      return fail(
        `Cannot join a session with status '${session.status}'`,
        "SESSION_NOT_JOINABLE",
        409
      );
    }

    return fail("Failed to create registration", "DB_ERROR", 500);
  }

  const { registration, payment } = registrationResult;

  await trackEvent("payment_initiated", {
    user_id: auth.appUserId,
    session_id: sessionId,
    club_id: session.club_id,
    amount: session.fee_twd,
    method: "manual",
  });

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
