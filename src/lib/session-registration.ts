import { supabaseAdmin } from "@/lib/db";
import { sessionStatusAfterRegistration } from "@/lib/state-machines/session";
import type { SessionStatus } from "@/types/domain";

const PLATFORM_FEE_RATE = 0.05;

export type RegistrableSession = {
  id: string;
  club_id: string;
  status: SessionStatus;
  capacity: number;
  fee_twd: number;
};

export async function createConfirmedRegistrationWithDebt(
  session: RegistrableSession,
  userId: string,
  nowIso = new Date().toISOString()
) {
  const { data: registration, error: regError } = await supabaseAdmin
    .from("session_registrations")
    .insert({
      session_id: session.id,
      user_id: userId,
      status: "confirmed",
      joined_at: nowIso,
    })
    .select()
    .single();

  if (regError || !registration) {
    throw new Error("Failed to create registration");
  }

  const platformFee = Math.round(session.fee_twd * PLATFORM_FEE_RATE);
  const netAmount = session.fee_twd - platformFee;

  const { data: payment, error: payError } = await supabaseAdmin
    .from("payment_transactions")
    .insert({
      session_id: session.id,
      registration_id: registration.id,
      club_id: session.club_id,
      payer_user_id: userId,
      gateway: "manual",
      amount_twd: session.fee_twd,
      platform_fee_twd: platformFee,
      net_amount_twd: netAmount,
      status: "initiated",
    })
    .select()
    .single();

  if (payError || !payment) {
    await supabaseAdmin.from("session_registrations").delete().eq("id", registration.id);
    throw new Error("Failed to create debt record");
  }

  await supabaseAdmin
    .from("session_registrations")
    .update({ payment_transaction_id: payment.id })
    .eq("id", registration.id);

  const { count } = await supabaseAdmin
    .from("session_registrations")
    .select("*", { count: "exact", head: true })
    .eq("session_id", session.id)
    .eq("status", "confirmed");

  const newStatus = sessionStatusAfterRegistration(
    session.status,
    count ?? 0,
    session.capacity
  );

  if (newStatus !== session.status) {
    await supabaseAdmin
      .from("sessions")
      .update({ status: newStatus, updated_at: nowIso })
      .eq("id", session.id);
  }

  return {
    registration,
    payment,
    newStatus,
  };
}