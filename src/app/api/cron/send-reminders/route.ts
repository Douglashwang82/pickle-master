import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";

// Send reminders for sessions starting in the next 24 hours
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("Authorization");

  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return fail("Unauthorized", "UNAUTHORIZED", 401);
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const nowStr = now.toISOString();

  // Find confirmed registrations for sessions starting in the next 24h
  const { data: upcomingRegs, error } = await supabaseAdmin
    .from("session_registrations")
    .select(`
      user_id, session_id,
      sessions(id, title, scheduled_start_at, location_name, fee_twd)
    `)
    .eq("status", "confirmed")
    .gte("sessions.scheduled_start_at", nowStr)
    .lte("sessions.scheduled_start_at", in24h);

  if (error) return fail("Failed to fetch registrations", "DB_ERROR", 500);

  if (!upcomingRegs || upcomingRegs.length === 0) {
    return ok({ queued: 0 });
  }

  // Check which notifications haven't been sent yet (idempotent)
  const notifications = upcomingRegs
    .filter((r) => r.sessions)
    .map((r) => ({
      user_id: r.user_id,
      channel: "in_app" as const,
      type: "session_reminder_24h",
      payload_json: {
        session_id: r.session_id,
        title: (r.sessions as { title: string } | null)?.title,
        scheduled_start_at: (r.sessions as { scheduled_start_at: string } | null)
          ?.scheduled_start_at,
        location_name: (r.sessions as { location_name: string } | null)?.location_name,
      },
      send_at: nowStr,
    }));

  if (notifications.length > 0) {
    await supabaseAdmin
      .from("notifications")
      .upsert(notifications, { ignoreDuplicates: true });
  }

  return ok({ queued: notifications.length });
}
