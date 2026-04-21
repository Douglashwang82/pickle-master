import { requireAuth, requireClubLeader, requireClubMember, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { getClubBoardData, queueImportantBoardNotifications } from "@/lib/board";
import { trackEvent } from "@/lib/analytics";
import { CreateBoardPostSchema } from "@/lib/validations/board";
import { ok, fail, parseJsonBody } from "@/lib/utils/api";

type Params = { params: Promise<{ clubId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { clubId } = await params;

  const memberGuard = await requireClubMember(clubId, auth.appUserId);
  if (memberGuard) return memberGuard;

  const leaderGuard = await requireClubLeader(clubId, auth.appUserId);
  const boardData = await getClubBoardData(clubId, auth.appUserId, !leaderGuard);

  return ok(boardData);
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { clubId } = await params;

  const memberGuard = await requireClubMember(clubId, auth.appUserId);
  if (memberGuard) return memberGuard;

  const { body, error: jsonError } = await parseJsonBody(request);
  if (jsonError) return jsonError;

  const parsed = CreateBoardPostSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation error", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  const leaderGuard = await requireClubLeader(clubId, auth.appUserId);
  const isLeader = !leaderGuard;
  const now = new Date().toISOString();
  const { kind, title, body: content, importance, is_pinned } = parsed.data;

  const { data: post, error } = await supabaseAdmin
    .from("club_board_posts")
    .insert({
      club_id: clubId,
      author_user_id: auth.appUserId,
      kind,
      title: title ?? null,
      body: content,
      status: isLeader ? "published" : "pending_review",
      importance,
      is_pinned: isLeader ? is_pinned : false,
      published_at: isLeader ? now : null,
      reviewed_by: isLeader ? auth.appUserId : null,
      reviewed_at: isLeader ? now : null,
    })
    .select(
      "id, club_id, author_user_id, kind, title, body, importance, status, is_pinned"
    )
    .single();

  if (error || !post) {
    return fail("Failed to create board post", "DB_ERROR", 500);
  }

  let queuedNotifications = 0;
  if (isLeader) {
    queuedNotifications = await queueImportantBoardNotifications({
      ...post,
      title: post.title,
    });

    await trackEvent("club_board_post_published", {
      user_id: auth.appUserId,
      club_id: clubId,
      board_post_id: post.id,
      board_kind: post.kind,
      board_importance: post.importance,
      queued_notifications: queuedNotifications,
    });
  } else {
    await trackEvent("club_board_post_submitted", {
      user_id: auth.appUserId,
      club_id: clubId,
      board_post_id: post.id,
      board_kind: post.kind,
      board_importance: post.importance,
    });
  }

  return ok(
    {
      post,
      queuedNotifications,
      status: isLeader ? "published" : "pending_review",
    },
    201
  );
}
