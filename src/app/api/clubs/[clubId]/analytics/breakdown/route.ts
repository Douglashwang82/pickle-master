import { requireAuth, requireClubLeader, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";
import { BreakdownQuerySchema } from "@/lib/validations/analytics";

type Params = { params: Promise<{ clubId: string }> };

export type BreakdownResponse = {
  segments: Array<{ label: string; value: number }>;
  meta: {
    dimension: "sport_type" | "fee_tier" | "session_revenue";
    generated_at: string;
  };
};

export async function GET(req: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { clubId } = await params;
  const guardError = await requireClubLeader(clubId, auth.appUserId);
  if (guardError) return guardError;

  const url = new URL(req.url);
  const parsed = BreakdownQuerySchema.safeParse({
    dimension: url.searchParams.get("dimension") ?? undefined,
  });
  if (!parsed.success) {
    return fail("Invalid query", "INVALID_QUERY", 400, parsed.error.flatten());
  }
  const { dimension } = parsed.data;

  let segments: Array<{ label: string; value: number }> = [];

  if (dimension === "fee_tier") {
    const { data, error } = await supabaseAdmin
      .from("sessions")
      .select("fee_twd")
      .eq("club_id", clubId);
    if (error) return fail("DB error", "DB_ERROR", 500);

    const tiers = { 免費: 0, "≤200": 0, "201-400": 0, "401-600": 0, "≥601": 0 };
    for (const s of data ?? []) {
      const f = s.fee_twd ?? 0;
      if (f === 0) tiers["免費"] += 1;
      else if (f <= 200) tiers["≤200"] += 1;
      else if (f <= 400) tiers["201-400"] += 1;
      else if (f <= 600) tiers["401-600"] += 1;
      else tiers["≥601"] += 1;
    }
    segments = Object.entries(tiers).map(([label, value]) => ({ label, value }));
  } else if (dimension === "sport_type") {
    const { data, error } = await supabaseAdmin
      .from("sessions")
      .select("sport_type")
      .eq("club_id", clubId);
    if (error) return fail("DB error", "DB_ERROR", 500);
    const counts: Record<string, number> = {};
    for (const s of data ?? []) {
      const k = (s as { sport_type?: string }).sport_type ?? "其他";
      counts[k] = (counts[k] ?? 0) + 1;
    }
    segments = Object.entries(counts).map(([label, value]) => ({ label, value }));
  } else {
    // session_revenue: top-N sessions by revenue
    const { data: payments, error } = await supabaseAdmin
      .from("payment_transactions")
      .select("session_id, amount_twd")
      .eq("club_id", clubId)
      .eq("status", "succeeded");
    if (error) return fail("DB error", "DB_ERROR", 500);

    const byId: Record<string, number> = {};
    for (const p of payments ?? []) {
      if (!p.session_id) continue;
      byId[p.session_id] = (byId[p.session_id] ?? 0) + p.amount_twd;
    }
    const top = Object.entries(byId)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const ids = top.map(([id]) => id);
    const titles: Record<string, string> = {};
    if (ids.length > 0) {
      const { data: sessions } = await supabaseAdmin
        .from("sessions")
        .select("id, title")
        .in("id", ids);
      for (const s of sessions ?? []) titles[s.id] = s.title;
    }
    segments = top.map(([id, value]) => ({
      label: titles[id] ?? id.slice(0, 6),
      value,
    }));
  }

  const response: BreakdownResponse = {
    segments,
    meta: { dimension, generated_at: new Date().toISOString() },
  };
  return ok(response);
}
