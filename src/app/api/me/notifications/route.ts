import { requireAuth, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";

// GET — fetch recent in-app notifications for the current user
export async function GET(_req: Request) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("id, type, payload_json, status, created_at")
    .eq("user_id", auth.appUserId)
    .eq("channel", "in_app")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return fail("Failed to fetch notifications", "DB_ERROR", 500);

  return ok(data ?? []);
}

// PATCH — mark all pending in-app notifications as read (status → "sent")
export async function PATCH(_req: Request) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { error } = await supabaseAdmin
    .from("notifications")
    .update({ status: "sent" })
    .eq("user_id", auth.appUserId)
    .eq("channel", "in_app")
    .eq("status", "pending");

  if (error) return fail("Failed to mark notifications read", "DB_ERROR", 500);

  return ok({ ok: true });
}
