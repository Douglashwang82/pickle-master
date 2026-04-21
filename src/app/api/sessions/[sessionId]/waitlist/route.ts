import { requireAuth, requireClubMember, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail, parseJsonBody } from "@/lib/utils/api";
import { trackEvent } from "@/lib/analytics";
import { getWaitlistPosition } from "@/lib/waitlist";
import { z } from "zod";

type Params = { params: Promise<{ sessionId: string }> };

const WaitlistBodySchema = z.object({}).strict();

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { sessionId } = await params;

  const { body, error: jsonError } = await parseJsonBody(request);
  if (jsonError) return jsonError;

  const parsed = WaitlistBodySchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation error", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  const { data: session } = await supabaseAdmin
    .from("sessions")
    .select("id, club_id, status, capacity")
    .eq("id", sessionId)
    .single();

  if (!session) return fail("Session not found", "NOT_FOUND", 404);

  if (!["published", "full"].includes(session.status)) {
    return fail("Session is not open for waitlist", "SESSION_NOT_JOINABLE", 409);
  }

  const memberGuard = await requireClubMember(session.club_id, auth.appUserId);
  if (memberGuard) return memberGuard;

  const { data: existingReg } = await supabaseAdmin
    .from("session_registrations")
    .select("id")
    .eq("session_id", sessionId)
    .eq("user_id", auth.appUserId)
    .in("status", ["confirmed", "payment_pending"])
    .maybeSingle();

  if (existingReg) {
    return fail("Already registered for this session", "ALREADY_REGISTERED", 409);
  }

  const { data: existingWaitlist } = await supabaseAdmin
    .from("session_waitlist_entries")
    .select("id")
    .eq("session_id", sessionId)
    .eq("user_id", auth.appUserId)
    .eq("status", "active")
    .maybeSingle();

  if (existingWaitlist) {
    const position = await getWaitlistPosition(sessionId, auth.appUserId);
    return ok({ waitlisted: true, position });
  }

  const { count: confirmedCount } = await supabaseAdmin
    .from("session_registrations")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("status", "confirmed");

  if ((confirmedCount ?? 0) < session.capacity) {
    return fail("Session still has open spots", "SESSION_NOT_FULL", 409);
  }

  const nowIso = new Date().toISOString();

  const { error } = await supabaseAdmin.from("session_waitlist_entries").insert({
    session_id: sessionId,
    user_id: auth.appUserId,
    status: "active",
    joined_at: nowIso,
    created_at: nowIso,
    updated_at: nowIso,
  });

  if (error) {
    return fail("Failed to join waitlist", "DB_ERROR", 500);
  }

  const position = await getWaitlistPosition(sessionId, auth.appUserId);

  await trackEvent("waitlist_joined", {
    user_id: auth.appUserId,
    club_id: session.club_id,
    session_id: sessionId,
    position,
  });

  return ok({ waitlisted: true, position }, 201);
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { sessionId } = await params;

  const { data: session } = await supabaseAdmin
    .from("sessions")
    .select("id, club_id")
    .eq("id", sessionId)
    .single();

  if (!session) return fail("Session not found", "NOT_FOUND", 404);

  const memberGuard = await requireClubMember(session.club_id, auth.appUserId);
  if (memberGuard) return memberGuard;

  const nowIso = new Date().toISOString();
  const { data: entry } = await supabaseAdmin
    .from("session_waitlist_entries")
    .update({ status: "left", left_at: nowIso, updated_at: nowIso })
    .eq("session_id", sessionId)
    .eq("user_id", auth.appUserId)
    .eq("status", "active")
    .select("id")
    .maybeSingle();

  if (!entry) {
    return fail("Not currently on the waitlist", "NOT_FOUND", 404);
  }

  return ok({ waitlisted: false });
}
