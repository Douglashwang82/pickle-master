import { requireAuth, requireClubLeader, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";
import { TimeseriesQuerySchema } from "@/lib/validations/analytics";

type Params = { params: Promise<{ clubId: string }> };

export type TimeseriesPoint = { x: string; y: number };
export type TimeseriesResponse = {
  series: TimeseriesPoint[];
  meta: {
    metric: "revenue" | "fill_rate" | "members";
    granularity: "day" | "week" | "month";
    range: "30d" | "90d" | "6m" | "1y";
    generated_at: string;
  };
};

function rangeToStart(range: "30d" | "90d" | "6m" | "1y"): Date {
  const now = new Date();
  const d = new Date(now);
  switch (range) {
    case "30d":
      d.setDate(d.getDate() - 30);
      break;
    case "90d":
      d.setDate(d.getDate() - 90);
      break;
    case "6m":
      d.setMonth(d.getMonth() - 6);
      d.setDate(1);
      break;
    case "1y":
      d.setFullYear(d.getFullYear() - 1);
      d.setDate(1);
      break;
  }
  d.setHours(0, 0, 0, 0);
  return d;
}

function bucketKey(iso: string, granularity: "day" | "week" | "month"): string {
  const d = new Date(iso);
  if (granularity === "day") {
    return d.toISOString().slice(0, 10);
  }
  if (granularity === "month") {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  }
  // week: Monday-anchored
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function enumerateBuckets(
  start: Date,
  end: Date,
  granularity: "day" | "week" | "month"
): string[] {
  const buckets: string[] = [];
  const cursor = new Date(start);
  if (granularity === "month") cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    if (granularity === "day") {
      buckets.push(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + 1);
    } else if (granularity === "week") {
      const day = cursor.getDay();
      const diff = (day === 0 ? -6 : 1) - day;
      const monday = new Date(cursor);
      monday.setDate(monday.getDate() + diff);
      buckets.push(monday.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + 7);
    } else {
      buckets.push(
        `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-01`
      );
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }
  return Array.from(new Set(buckets));
}

export async function GET(req: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { clubId } = await params;
  const guardError = await requireClubLeader(clubId, auth.appUserId);
  if (guardError) return guardError;

  const url = new URL(req.url);
  const parsed = TimeseriesQuerySchema.safeParse({
    metric: url.searchParams.get("metric") ?? undefined,
    granularity: url.searchParams.get("granularity") ?? undefined,
    range: url.searchParams.get("range") ?? undefined,
  });
  if (!parsed.success) {
    return fail("Invalid query", "INVALID_QUERY", 400, parsed.error.flatten());
  }
  const { metric, granularity, range } = parsed.data;

  const start = rangeToStart(range);
  const end = new Date();
  const buckets = enumerateBuckets(start, end, granularity);
  const seriesMap: Record<string, number> = Object.fromEntries(
    buckets.map((b) => [b, 0])
  );

  if (metric === "revenue") {
    const { data, error } = await supabaseAdmin
      .from("payment_transactions")
      .select("amount_twd, created_at")
      .eq("club_id", clubId)
      .eq("status", "succeeded")
      .gte("created_at", start.toISOString());
    if (error) return fail("DB error", "DB_ERROR", 500);
    for (const row of data ?? []) {
      const k = bucketKey(row.created_at, granularity);
      if (k in seriesMap) seriesMap[k] += row.amount_twd;
    }
  } else if (metric === "members") {
    const { data, error } = await supabaseAdmin
      .from("club_memberships")
      .select("joined_at, status")
      .eq("club_id", clubId)
      .eq("status", "active");
    if (error) return fail("DB error", "DB_ERROR", 500);
    // cumulative member count at end of each bucket
    const sorted = (data ?? [])
      .map((m) => m.joined_at)
      .sort((a, b) => a.localeCompare(b));
    let idx = 0;
    let cumulative = 0;
    for (const b of buckets) {
      // include everyone joined on or before bucket end
      const bucketEnd = new Date(b);
      if (granularity === "day") bucketEnd.setDate(bucketEnd.getDate() + 1);
      else if (granularity === "week") bucketEnd.setDate(bucketEnd.getDate() + 7);
      else bucketEnd.setMonth(bucketEnd.getMonth() + 1);
      while (idx < sorted.length && sorted[idx] < bucketEnd.toISOString()) {
        cumulative += 1;
        idx += 1;
      }
      seriesMap[b] = cumulative;
    }
  } else {
    // fill_rate: per-completed-session ratio averaged within bucket
    const { data: sessions, error: sErr } = await supabaseAdmin
      .from("sessions")
      .select("id, capacity, scheduled_start_at, status")
      .eq("club_id", clubId)
      .in("status", ["completed", "auto_closed"])
      .gte("scheduled_start_at", start.toISOString());
    if (sErr) return fail("DB error", "DB_ERROR", 500);

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
    const sumByBucket: Record<string, number> = {};
    const cntByBucket: Record<string, number> = {};
    for (const s of sessions ?? []) {
      if (s.capacity <= 0) continue;
      const k = bucketKey(s.scheduled_start_at, granularity);
      if (!(k in seriesMap)) continue;
      const rate = ((regCount[s.id] ?? 0) / s.capacity) * 100;
      sumByBucket[k] = (sumByBucket[k] ?? 0) + rate;
      cntByBucket[k] = (cntByBucket[k] ?? 0) + 1;
    }
    for (const b of buckets) {
      seriesMap[b] = cntByBucket[b]
        ? Math.round((sumByBucket[b] / cntByBucket[b]) * 10) / 10
        : 0;
    }
  }

  const series: TimeseriesPoint[] = buckets.map((b) => ({
    x: b,
    y: seriesMap[b] ?? 0,
  }));

  const response: TimeseriesResponse = {
    series,
    meta: {
      metric,
      granularity,
      range,
      generated_at: new Date().toISOString(),
    },
  };
  return ok(response);
}
