import { requireAuth, requireClubLeader, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { queueImportantBoardNotifications } from "@/lib/board";
import { trackEvent } from "@/lib/analytics";
import { ReviewBoardPostSchema } from "@/lib/validations/board";
import { ok, fail } from "@/lib/utils/api";

type Params = { params: Promise<{ clubId: string; postId: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { clubId, postId } = await params;

  const leaderGuard = await requireClubLeader(clubId, auth.appUserId);
  if (leaderGuard) return leaderGuard;

  const body: unknown = await request.json().catch(() => ({}));
  const parsed = ReviewBoardPostSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation error", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  const { data: existingPost } = await supabaseAdmin
    .from("club_board_posts")
    .select(
      "id, club_id, author_user_id, kind, title, body, status, importance, is_pinned"
    )
    .eq("id", postId)
    .eq("club_id", clubId)
    .single();

  if (!existingPost) {
    return fail("Board post not found", "NOT_FOUND", 404);
  }

  if (existingPost.status !== "pending_review") {
    return fail("Board post is no longer pending review", "INVALID_STATE", 409);
  }

  const now = new Date().toISOString();
  const { decision, rejection_reason, importance, is_pinned } = parsed.data;
  const nextStatus = decision === "approve" ? "published" : "rejected";

  const { data: updatedPost, error } = await supabaseAdmin
    .from("club_board_posts")
    .update({
      status: nextStatus,
      importance: importance ?? existingPost.importance,
      is_pinned: decision === "approve" ? is_pinned ?? existingPost.is_pinned : false,
      rejection_reason: decision === "reject" ? rejection_reason ?? null : null,
      reviewed_by: auth.appUserId,
      reviewed_at: now,
      published_at: decision === "approve" ? now : null,
      updated_at: now,
    })
    .eq("id", postId)
    .eq("club_id", clubId)
    .select(
      "id, club_id, author_user_id, kind, title, body, importance, status, is_pinned"
    )
    .single();

  if (error || !updatedPost) {
    return fail("Failed to review board post", "DB_ERROR", 500);
  }

  let queuedNotifications = 0;
  if (decision === "approve") {
    queuedNotifications = await queueImportantBoardNotifications({
      ...updatedPost,
      title: updatedPost.title,
    });

    await trackEvent("club_board_post_published", {
      user_id: auth.appUserId,
      club_id: clubId,
      board_post_id: updatedPost.id,
      board_kind: updatedPost.kind,
      board_importance: updatedPost.importance,
      queued_notifications: queuedNotifications,
    });
  }

  return ok({
    post: updatedPost,
    queuedNotifications,
    status: nextStatus,
  });
}