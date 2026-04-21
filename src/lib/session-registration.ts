import { supabaseAdmin } from "@/lib/db";
import type { SessionStatus } from "@/types/domain";

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
  const { data, error } = await supabaseAdmin.rpc(
    "app_create_confirmed_registration_with_debt",
    {
      p_session_id: session.id,
      p_user_id: userId,
      p_now: nowIso,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  const [result] = (data ?? []) as unknown as {
    registration_id: string;
    payment_transaction_id: string;
    new_status: SessionStatus;
    amount_twd: number;
  }[];

  if (!result) {
    throw new Error("Failed to create registration");
  }

  return {
    registration: { id: result.registration_id },
    payment: { id: result.payment_transaction_id, amount_twd: result.amount_twd },
    newStatus: result.new_status,
  };
}
