import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";

// Auto-close sessions that ended more than 2 hours ago
const GRACE_PERIOD_HOURS = 2;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("Authorization");

  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return fail("Unauthorized", "UNAUTHORIZED", 401);
  }

  const cutoff = new Date(
    Date.now() - GRACE_PERIOD_HOURS * 60 * 60 * 1000
  ).toISOString();

  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("sessions")
    .update({ status: "auto_closed", updated_at: now })
    .in("status", ["published", "full"])
    .lt("scheduled_end_at", cutoff)
    .select("id");

  if (error) return fail("Failed to close sessions", "DB_ERROR", 500);

  return ok({ closed: data?.length ?? 0 });
}
