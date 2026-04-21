import { requireAuth, requireClubMember, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { trackEvent } from "@/lib/analytics";
import { ToggleBoardReactionSchema } from "@/lib/validations/board";
import { ok, fail, parseJsonBody } from "@/lib/utils/api";

type Params = { params: Promise<{ clubId: string; postId: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { clubId, postId } = await params;

  const memberGuard = await requireClubMember(clubId, auth.appUserId);
  if (memberGuard) return memberGuard;

  const { body, error: jsonError } = await parseJsonBody(request);
  if (jsonError) return jsonError;

  const parsed = ToggleBoardReactionSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation error", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  const { data: post } = await supabaseAdmin
    .from("club_board_posts")
    .select("id, status")
    .eq("id", postId)
    .eq("club_id", clubId)
    .single();

  if (!post) {
    return fail("Board post not found", "NOT_FOUND", 404);
  }

  if (post.status !== "published") {
    return fail("Only published posts can receive reactions", "INVALID_STATE", 409);
  }

  const { emoji, active } = parsed.data;
  const { data: existingReaction } = await supabaseAdmin
    .from("club_board_reactions")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", auth.appUserId)
    .eq("emoji", emoji)
    .single();

  if (active) {
    if (!existingReaction) {
      const { error } = await supabaseAdmin.from("club_board_reactions").insert({
        post_id: postId,
        user_id: auth.appUserId,
        emoji,
      });

      if (error) {
        return fail("Failed to save board reaction", "DB_ERROR", 500);
      }

      await trackEvent("club_board_reaction_added", {
        user_id: auth.appUserId,
        club_id: clubId,
        board_post_id: postId,
        emoji,
      });
    }
  } else if (existingReaction) {
    const { error } = await supabaseAdmin
      .from("club_board_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", auth.appUserId)
      .eq("emoji", emoji);

    if (error) {
      return fail("Failed to remove board reaction", "DB_ERROR", 500);
    }
  }

  return ok({ emoji, active });
}
