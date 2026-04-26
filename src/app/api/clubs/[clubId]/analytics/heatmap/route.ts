import { requireAuth, requireClubLeader, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";
import { HeatmapQuerySchema } from "@/lib/validations/analytics";

type Params = { params: Promise<{ clubId: string }> };

export type HeatmapResponse = {
  // 7 rows (Sun..Sat) × 24 cols (0..23) of confirmed-registration counts
  matrix: number[][];
  max: number;
  meta: {
    range: "30d" | "90d" | "1y";
    generated_at: string;
  };
};

function rangeToStart(range: "30d" | "90d" | "1y"): Date {
  const d = new Date();
  if (range === "30d") d.setDate(d.getDate() - 30);
  else if (range === "90d") d.setDate(d.getDate() - 90);
  else d.setFullYear(d.getFullYear() - 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(req: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { clubId } = await params;
  const guardError = await requireClubLeader(clubId, auth.appUserId);
  if (guardError) return guardError;

  const url = new URL(req.url);
  const parsed = HeatmapQuerySchema.safeParse({
    range: url.searchParams.get("range") ?? undefined,
  });
  if (!parsed.success) {
    return fail("Invalid query", "INVALID_QUERY", 400, parsed.error.flatten());
  }
  const { range } = parsed.data;

  const start = rangeToStart(range);

  const { data: sessions, error } = await supabaseAdmin
    .from("sessions")
    .select("id, scheduled_start_at, status")
    .eq("club_id", clubId)
    .in("status", ["completed", "auto_closed", "published", "full"])
    .gte("scheduled_start_at", start.toISOString());
  if (error) return fail("DB error", "DB_ERROR", 500);

  const sessIds = (sessions ?? []).map((s) => s.id);
  const regCount: Record<string, number> = {};
  if (sessIds.length > 0) {
    const { data: regs } = await supabaseAdmin
      .from("session_registrations")
      .select("session_id")
      .in("session_id", sessIds)
      .eq("status", "confirmed");
    for (const r of regs ?? []) {
      regCount[r.session_id] = (regCount[r.session_id] ?? 0) + 1;
    }
  }

  const matrix: number[][] = Array.from({ length: 7 }, () =>
    Array(24).fill(0)
  );
  let max = 0;
  for (const s of sessions ?? []) {
    const d = new Date(s.scheduled_start_at);
    const day = d.getDay();
    const hour = d.getHours();
    const count = regCount[s.id] ?? 0;
    matrix[day][hour] += count;
    if (matrix[day][hour] > max) max = matrix[day][hour];
  }

  const response: HeatmapResponse = {
    matrix,
    max,
    meta: { range, generated_at: new Date().toISOString() },
  };
  return ok(response);
}
