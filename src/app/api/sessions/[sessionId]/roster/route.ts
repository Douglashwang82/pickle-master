import { requireAuth, requireClubMember, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";

type Params = { params: Promise<{ sessionId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { sessionId } = await params;

  const { data: session } = await supabaseAdmin
    .from("sessions")
    .select("club_id")
    .eq("id", sessionId)
    .single();

  if (!session) return fail("Session not found", "NOT_FOUND", 404);

  const guardError = await requireClubMember(session.club_id, auth.appUserId);
  if (guardError) return guardError;

  const { data: registrations, error } = await supabaseAdmin
    .from("session_registrations")
    .select("id, user_id, status, joined_at, payment_transaction_id")
    .eq("session_id", sessionId)
    .in("status", ["confirmed", "payment_pending"])
    .order("joined_at", { ascending: true });

  if (error) return fail("Failed to fetch roster", "DB_ERROR", 500);

  const userIds = (registrations ?? []).map((r) => r.user_id);
  const paymentTxIds = (registrations ?? [])
    .map((r) => r.payment_transaction_id)
    .filter(Boolean) as string[];

  // Fetch profiles and payment transactions in parallel
  const [{ data: profiles }, { data: payments }] = await Promise.all([
    userIds.length
      ? supabaseAdmin
          .from("profiles")
          .select("user_id, display_name, photo_url, skill_level")
          .in("user_id", userIds)
      : Promise.resolve({ data: [] }),
    paymentTxIds.length
      ? supabaseAdmin
          .from("payment_transactions")
          .select("id, status, amount_twd, debt_notified_at")
          .in("id", paymentTxIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p]));
  const paymentMap = Object.fromEntries(
    (payments ?? []).map((p) => [p.id, p])
  );

  const result = (registrations ?? []).map((r) => ({
    ...r,
    profile: profileMap[r.user_id] ?? null,
    payment: r.payment_transaction_id ? (paymentMap[r.payment_transaction_id] ?? null) : null,
  }));

  return ok(result);
}
