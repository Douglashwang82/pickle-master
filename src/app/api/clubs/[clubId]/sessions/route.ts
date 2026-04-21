import { requireAuth, requireClubLeader, requireClubMember, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail, parseJsonBody } from "@/lib/utils/api";
import { CreateSessionSchema } from "@/lib/validations/sessions";
import { trackEvent } from "@/lib/analytics";

type Params = { params: Promise<{ clubId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { clubId } = await params;

  const guardError = await requireClubMember(clubId, auth.appUserId);
  if (guardError) return guardError;

  const { data, error } = await supabaseAdmin
    .from("sessions")
    .select("*")
    .eq("club_id", clubId)
    .in("status", ["published", "full"])
    .gte("scheduled_start_at", new Date().toISOString())
    .order("scheduled_start_at", { ascending: true });

  if (error) return fail("Failed to fetch sessions", "DB_ERROR", 500);

  // Attach confirmed_count to each session
  const sessionIds = (data ?? []).map((s) => s.id);
  const { data: counts } = await supabaseAdmin
    .from("session_registrations")
    .select("session_id")
    .in("session_id", sessionIds)
    .eq("status", "confirmed");

  const countMap: Record<string, number> = {};
  for (const row of counts ?? []) {
    countMap[row.session_id] = (countMap[row.session_id] ?? 0) + 1;
  }

  const sessionsWithSpots = (data ?? []).map((s) => ({
    ...s,
    confirmed_count: countMap[s.id] ?? 0,
    available_spots: s.capacity - (countMap[s.id] ?? 0),
  }));

  return ok(sessionsWithSpots);
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { clubId } = await params;

  const guardError = await requireClubLeader(clubId, auth.appUserId);
  if (guardError) return guardError;

  const { body, error: jsonError } = await parseJsonBody(request);
  if (jsonError) return jsonError;

  const parsed = CreateSessionSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation error", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  // Fetch venue to get its name as the legacy location_name fallback
  const { data: venue } = await supabaseAdmin
    .from("venues" as any)
    .select("name")
    .eq("id", parsed.data.venue_id)
    .single();

  if (!venue) {
    return fail("Invalid venue selected", "VALIDATION_ERROR", 400);
  }

  const selectedVenue = venue as unknown as { name: string };

  const { data: session, error } = await supabaseAdmin
    .from("sessions")
    .insert({
      ...parsed.data,
      location_name: selectedVenue.name,
      club_id: clubId,
      created_by: auth.appUserId,
      status: "published",
    })
    .select()
    .single();

  if (error || !session) {
    return fail("Failed to create session", "DB_ERROR", 500);
  }

  await trackEvent("session_created", {
    user_id: auth.appUserId,
    club_id: clubId,
    session_id: session.id,
    capacity: session.capacity,
    fee: session.fee_twd,
  });

  return ok(session, 201);
}
