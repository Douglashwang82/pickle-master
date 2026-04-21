import { requireAuth, requireClubLeader, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { PinBoardPostSchema } from "@/lib/validations/board";
import { ok, fail, parseJsonBody } from "@/lib/utils/api";

type Params = { params: Promise<{ clubId: string; postId: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { clubId, postId } = await params;

  const leaderGuard = await requireClubLeader(clubId, auth.appUserId);
  if (leaderGuard) return leaderGuard;

  const { body, error: jsonError } = await parseJsonBody(request);
  if (jsonError) return jsonError;

  const parsed = PinBoardPostSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation error", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  const { data: updatedPost, error } = await supabaseAdmin
    .from("club_board_posts")
    .update({
      is_pinned: parsed.data.is_pinned,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .eq("club_id", clubId)
    .eq("status", "published")
    .select("id, is_pinned")
    .single();

  if (error || !updatedPost) {
    return fail("Failed to update board pin state", "DB_ERROR", 500);
  }

  return ok(updatedPost);
}
