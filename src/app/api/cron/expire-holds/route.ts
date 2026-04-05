import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";
import { sessionStatusAfterRegistration } from "@/lib/state-machines/session";
import type { SessionStatus } from "@/types/domain";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("Authorization");

  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return fail("Unauthorized", "UNAUTHORIZED", 401);
  }

  const now = new Date().toISOString();

  // Find expired payment_pending registrations
  const { data: expiredRegs } = await supabaseAdmin
    .from("session_registrations")
    .select("id, session_id")
    .eq("status", "payment_pending")
    .lt("booking_hold_expires_at", now);

  if (!expiredRegs || expiredRegs.length === 0) {
    return ok({ expired: 0 });
  }

  // Cancel them
  await supabaseAdmin
    .from("session_registrations")
    .update({ status: "cancelled", cancelled_at: now })
    .in("id", expiredRegs.map((r) => r.id));

  // For each affected session, recheck capacity and transition if needed
  const sessionIdSet = new Set(expiredRegs.map((r) => r.session_id));
  const sessionIds = Array.from(sessionIdSet);

  for (const sessionId of sessionIds) {
    const { data: session } = await supabaseAdmin
      .from("sessions")
      .select("id, status, capacity")
      .eq("id", sessionId)
      .single();

    if (!session) continue;

    const { count } = await supabaseAdmin
      .from("session_registrations")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .eq("status", "confirmed");

    const newStatus = sessionStatusAfterRegistration(
      session.status as SessionStatus,
      count ?? 0,
      session.capacity
    );

    if (newStatus !== session.status) {
      await supabaseAdmin
        .from("sessions")
        .update({ status: newStatus, updated_at: now })
        .eq("id", sessionId);
    }
  }

  return ok({ expired: expiredRegs.length });
}
