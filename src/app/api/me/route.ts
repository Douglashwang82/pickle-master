import { requireAuth, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";

export async function GET() {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*, profiles(*)")
    .eq("id", auth.appUserId)
    .single();

  if (error || !data) {
    return fail("User not found", "USER_NOT_FOUND", 404);
  }

  return ok(data);
}
