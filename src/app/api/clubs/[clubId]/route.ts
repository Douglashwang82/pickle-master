import { requireAuth, requireClubLeader, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail, parseJsonBody } from "@/lib/utils/api";
import { UpdateClubSchema } from "@/lib/validations/clubs";

type Params = { params: Promise<{ clubId: string }> };

// GET by slug or UUID
export async function GET(_req: Request, { params }: Params) {
  const { clubId } = await params;

  // Support lookup by slug (short) or UUID
  const isUuid = /^[0-9a-f-]{36}$/.test(clubId);
  const query = supabaseAdmin
    .from("clubs")
    .select(
      `*, club_memberships(count), sessions(count)`
    );

  const { data, error } = isUuid
    ? await query.eq("id", clubId).single()
    : await query.eq("slug", clubId).single();

  if (error || !data) {
    return fail("Club not found", "NOT_FOUND", 404);
  }

  return ok(data);
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { clubId } = await params;

  const guardError = await requireClubLeader(clubId, auth.appUserId);
  if (guardError) return guardError;

  const { body, error: jsonError } = await parseJsonBody(request);
  if (jsonError) return jsonError;

  const parsed = UpdateClubSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation error", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  const { data, error } = await supabaseAdmin
    .from("clubs")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", clubId)
    .select()
    .single();

  if (error || !data) {
    return fail("Failed to update club", "DB_ERROR", 500);
  }

  return ok(data);
}
