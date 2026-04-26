import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/db";
import SessionToolbar from "@/components/clubs/manage/SessionToolbar";
import SessionRow from "@/components/clubs/manage/SessionRow";
import SessionCalendar from "@/components/clubs/manage/SessionCalendar";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string; status?: string }>;
};

type SessionStatus = "upcoming" | "past" | "cancelled" | "all";

const VALID_VIEW = new Set(["list", "calendar"]);
const VALID_STATUS = new Set<SessionStatus>([
  "upcoming",
  "past",
  "cancelled",
  "all",
]);

export default async function ManageSessionsPage({
  params,
  searchParams,
}: Params) {
  const { slug } = await params;
  const { view: viewQ, status: statusQ } = await searchParams;
  const view: "list" | "calendar" = VALID_VIEW.has(viewQ ?? "")
    ? (viewQ as "list" | "calendar")
    : "list";
  const status: SessionStatus = VALID_STATUS.has(statusQ as SessionStatus)
    ? (statusQ as SessionStatus)
    : "upcoming";

  const { data: club } = await supabaseAdmin
    .from("clubs")
    .select("id")
    .eq("slug", slug)
    .single();
  if (!club) notFound();

  const now = new Date().toISOString();
  let query = supabaseAdmin
    .from("sessions")
    .select(
      "id, title, status, scheduled_start_at, capacity, fee_twd, location_name"
    )
    .eq("club_id", club.id);

  if (status === "upcoming") {
    query = query
      .in("status", ["published", "full"])
      .gte("scheduled_start_at", now);
  } else if (status === "past") {
    query = query.in("status", ["completed", "auto_closed"]);
  } else if (status === "cancelled") {
    query = query.eq("status", "cancelled");
  }

  const { data: rawSessions } = await query.order("scheduled_start_at", {
    ascending: status === "upcoming",
  });
  const sessions = rawSessions ?? [];
  const sessionIds = sessions.map((s) => s.id);

  const regCount: Record<string, number> = {};
  if (sessionIds.length > 0) {
    const { data: regs } = await supabaseAdmin
      .from("session_registrations")
      .select("session_id")
      .in("session_id", sessionIds)
      .eq("status", "confirmed");
    for (const r of regs ?? []) {
      regCount[r.session_id] = (regCount[r.session_id] ?? 0) + 1;
    }
  }

  const paidCount: Record<string, number> = {};
  const refundCount: Record<string, number> = {};
  if (sessionIds.length > 0) {
    const { data: pays } = await supabaseAdmin
      .from("payment_transactions")
      .select("session_id, status")
      .in("session_id", sessionIds);
    for (const p of pays ?? []) {
      if (!p.session_id) continue;
      if (p.status === "succeeded")
        paidCount[p.session_id] = (paidCount[p.session_id] ?? 0) + 1;
      if (p.status === "refunded")
        refundCount[p.session_id] = (refundCount[p.session_id] ?? 0) + 1;
    }
  }

  const enriched = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    status: s.status,
    scheduled_start_at: s.scheduled_start_at,
    capacity: s.capacity,
    fee_twd: s.fee_twd,
    location_name: s.location_name,
    confirmed_count: regCount[s.id] ?? 0,
    paid_count: paidCount[s.id] ?? 0,
    refund_count: refundCount[s.id] ?? 0,
  }));

  return (
    <div>
      <SessionToolbar slug={slug} view={view} status={status} />

      {enriched.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/40 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {status === "upcoming"
              ? "沒有即將舉辦的場次"
              : status === "past"
                ? "尚無已完成的場次"
                : status === "cancelled"
                  ? "沒有已取消的場次"
                  : "沒有任何場次"}
          </p>
        </div>
      ) : view === "calendar" ? (
        <SessionCalendar sessions={enriched} />
      ) : (
        <div className="space-y-3">
          {enriched.map((s) => (
            <SessionRow key={s.id} session={s} />
          ))}
        </div>
      )}
    </div>
  );
}
