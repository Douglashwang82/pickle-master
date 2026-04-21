import { requireAuth, requireClubLeader, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail, parseJsonBody } from "@/lib/utils/api";
import { z } from "zod";
import { trackEvent } from "@/lib/analytics";

type Params = { params: Promise<{ clubId: string }> };

const SubmitApplicationSchema = z.object({
  intro_message: z.string().max(500).optional(),
});

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { clubId } = await params;

  const { body, error: jsonError } = await parseJsonBody(request);
  if (jsonError) return jsonError;

  const parsed = SubmitApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation error", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  // Check club exists and is active
  const { data: club } = await supabaseAdmin
    .from("clubs")
    .select("id, membership_type")
    .eq("id", clubId)
    .eq("status", "active")
    .single();

  if (!club) return fail("Club not found", "NOT_FOUND", 404);

  // Check not already a member
  const { data: existingMembership } = await supabaseAdmin
    .from("club_memberships")
    .select("id, status")
    .eq("club_id", clubId)
    .eq("user_id", auth.appUserId)
    .single();

  if (existingMembership?.status === "active") {
    return fail("Already a member", "ALREADY_MEMBER", 409);
  }

  // Open-join clubs: skip the application queue and grant membership immediately.
  if (club.membership_type === "open") {
    const { data: membership, error: memberError } = await supabaseAdmin
      .from("club_memberships")
      .insert({
        club_id: clubId,
        user_id: auth.appUserId,
        role: "member",
        status: "active",
      })
      .select()
      .single();

    if (memberError || !membership) {
      return fail("Failed to join club", "DB_ERROR", 500);
    }

    await trackEvent("membership_joined", {
      user_id: auth.appUserId,
      club_id: clubId,
    });

    return ok({ ...membership, membership_type: "open" }, 201);
  }

  // Application-based clubs: check for pending application before inserting.
  const { data: existingApp } = await supabaseAdmin
    .from("membership_applications")
    .select("id")
    .eq("club_id", clubId)
    .eq("user_id", auth.appUserId)
    .eq("status", "pending")
    .single();

  if (existingApp) {
    return fail("Application already pending", "APPLICATION_PENDING", 409);
  }

  const { data: application, error } = await supabaseAdmin
    .from("membership_applications")
    .insert({
      club_id: clubId,
      user_id: auth.appUserId,
      intro_message: parsed.data.intro_message,
    })
    .select()
    .single();

  if (error || !application) {
    return fail("Failed to submit application", "DB_ERROR", 500);
  }

  await trackEvent("membership_applied", {
    user_id: auth.appUserId,
    club_id: clubId,
  });

  return ok(application, 201);
}

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { clubId } = await params;

  const guardError = await requireClubLeader(clubId, auth.appUserId);
  if (guardError) return guardError;

  const { data: applications, error } = await supabaseAdmin
    .from("membership_applications")
    .select("id, user_id, intro_message, status, created_at")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false });

  if (error) return fail("Failed to fetch applications", "DB_ERROR", 500);

  const userIds = (applications ?? []).map((a) => a.user_id);
  const { data: profiles } = userIds.length
    ? await supabaseAdmin
        .from("profiles")
        .select("user_id, display_name, photo_url, skill_level, bio")
        .in("user_id", userIds)
    : { data: [] };

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p]));

  const result = (applications ?? []).map((a) => ({
    ...a,
    profile: profileMap[a.user_id] ?? null,
  }));

  return ok(result);
}
