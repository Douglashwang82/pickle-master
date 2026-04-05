import { requireAuth, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";

type Params = { params: Promise<{ sessionId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { sessionId } = await params;

  const { data: session, error } = await supabaseAdmin
    .from("sessions")
    .select("*, clubs(id, slug, name)")
    .eq("id", sessionId)
    .single();

  if (error || !session) return fail("Session not found", "NOT_FOUND", 404);

  // Count confirmed registrations
  const { count } = await supabaseAdmin
    .from("session_registrations")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("status", "confirmed");

  return ok({
    ...session,
    confirmed_count: count ?? 0,
    available_spots: session.capacity - (count ?? 0),
  });
}
