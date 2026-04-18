import { supabaseAdmin } from "@/lib/db";
import { createConfirmedRegistrationWithDebt, type RegistrableSession } from "@/lib/session-registration";
import { trackEvent } from "@/lib/analytics";

type WaitlistEntry = {
  id: string;
  user_id: string;
  joined_at: string;
};

export async function getWaitlistPosition(sessionId: string, userId: string) {
  const { data: entries } = await supabaseAdmin
    .from("session_waitlist_entries")
    .select("id, user_id, joined_at")
    .eq("session_id", sessionId)
    .eq("status", "active")
    .order("joined_at", { ascending: true })
    .order("created_at", { ascending: true });

  if (!entries) return null;

  const position = (entries as WaitlistEntry[]).findIndex((entry) => entry.user_id === userId);
  return position >= 0 ? position + 1 : null;
}

export async function promoteNextWaitlistedMember(
  session: RegistrableSession & { title: string },
  nowIso = new Date().toISOString()
) {
  const { count } = await supabaseAdmin
    .from("session_registrations")
    .select("*", { count: "exact", head: true })
    .eq("session_id", session.id)
    .eq("status", "confirmed");

  if ((count ?? 0) >= session.capacity) {
    return null;
  }

  const { data: waitlistEntries } = await supabaseAdmin
    .from("session_waitlist_entries")
    .select("id, user_id, joined_at")
    .eq("session_id", session.id)
    .eq("status", "active")
    .order("joined_at", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(5);

  for (const entry of (waitlistEntries as WaitlistEntry[] | null) ?? []) {
    const { data: existingReg } = await supabaseAdmin
      .from("session_registrations")
      .select("id")
      .eq("session_id", session.id)
      .eq("user_id", entry.user_id)
      .in("status", ["confirmed", "payment_pending"])
      .maybeSingle();

    if (existingReg) {
      await supabaseAdmin
        .from("session_waitlist_entries")
        .update({ status: "left", left_at: nowIso, updated_at: nowIso })
        .eq("id", entry.id);
      continue;
    }

    const { registration, payment, newStatus } = await createConfirmedRegistrationWithDebt(
      session,
      entry.user_id,
      nowIso
    );

    await supabaseAdmin
      .from("session_waitlist_entries")
      .update({
        status: "promoted",
        promoted_at: nowIso,
        promoted_registration_id: registration.id,
        updated_at: nowIso,
      })
      .eq("id", entry.id);

    await supabaseAdmin.from("notifications").insert({
      user_id: entry.user_id,
      channel: "in_app",
      type: "waitlist_promoted",
      payload_json: {
        session_id: session.id,
        session_title: session.title,
        amount_twd: payment.amount_twd,
      },
    });

    await trackEvent("waitlist_promoted", {
      user_id: entry.user_id,
      club_id: session.club_id,
      session_id: session.id,
      amount: payment.amount_twd,
    });

    return {
      userId: entry.user_id,
      registrationId: registration.id,
      paymentTransactionId: payment.id,
      newStatus,
    };
  }

  return null;
}