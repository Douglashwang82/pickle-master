import { supabaseAdmin } from "@/lib/db";
import { BOARD_REACTION_EMOJIS } from "@/lib/board-config";
import type {
  BoardPostImportance,
  BoardPostKind,
  BoardPostStatus,
  BoardPostWithMeta,
  BoardReactionEmoji,
  BoardReactionSummary,
  BoardUserPreview,
  ClubBoardData,
} from "@/types/domain";

type BoardPostRow = {
  id: string;
  club_id: string;
  author_user_id: string;
  reviewed_by: string | null;
  kind: BoardPostKind;
  title: string | null;
  body: string;
  status: BoardPostStatus;
  importance: BoardPostImportance;
  is_pinned: boolean;
  rejection_reason: string | null;
  published_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

type BoardReactionRow = {
  post_id: string;
  user_id: string;
  emoji: BoardReactionEmoji;
};

type ProfileRow = {
  user_id: string;
  display_name: string;
  photo_url: string | null;
};

type ImportantNotificationPayload = {
  id: string;
  club_id: string;
  author_user_id: string;
  kind: BoardPostKind;
  importance: BoardPostImportance;
  title: string | null;
  body: string;
};

function emptyBoardData(): ClubBoardData {
  return {
    featuredPost: null,
    publishedPosts: [],
    pendingPosts: [],
  };
}

function buildReactionSummary(
  postId: string,
  reactionsByPost: Map<string, Map<BoardReactionEmoji, number>>,
  viewerReactionSet: Set<string>
): BoardReactionSummary[] {
  const counts = reactionsByPost.get(postId) ?? new Map<BoardReactionEmoji, number>();

  return BOARD_REACTION_EMOJIS.map((emoji) => ({
    emoji,
    count: counts.get(emoji) ?? 0,
    reacted: viewerReactionSet.has(`${postId}:${emoji}`),
  }));
}

function buildPostView(
  post: BoardPostRow,
  profileMap: Map<string, BoardUserPreview>,
  reactionsByPost: Map<string, Map<BoardReactionEmoji, number>>,
  viewerReactionSet: Set<string>
): BoardPostWithMeta {
  return {
    id: post.id,
    club_id: post.club_id,
    author_user_id: post.author_user_id,
    reviewed_by: post.reviewed_by,
    kind: post.kind,
    title: post.title,
    body: post.body,
    status: post.status,
    importance: post.importance,
    is_pinned: post.is_pinned,
    rejection_reason: post.rejection_reason,
    published_at: post.published_at,
    reviewed_at: post.reviewed_at,
    created_at: post.created_at,
    updated_at: post.updated_at,
    author: profileMap.get(post.author_user_id) ?? null,
    reviewer: post.reviewed_by ? profileMap.get(post.reviewed_by) ?? null : null,
    reactions: buildReactionSummary(post.id, reactionsByPost, viewerReactionSet),
  };
}

export async function getClubBoardData(
  clubId: string,
  viewerUserId: string | null,
  isLeader: boolean
): Promise<ClubBoardData> {
  let query = supabaseAdmin
    .from("club_board_posts")
    .select(
      "id, club_id, author_user_id, reviewed_by, kind, title, body, status, importance, is_pinned, rejection_reason, published_at, reviewed_at, created_at, updated_at"
    )
    .eq("club_id", clubId);

  query = isLeader
    ? query.in("status", ["published", "pending_review"])
    : query.eq("status", "published");

  const { data: postData, error: postError } = await query
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (postError) {
    return emptyBoardData();
  }

  const posts = (postData ?? []) as BoardPostRow[];
  if (posts.length === 0) {
    return emptyBoardData();
  }

  const postIds = posts.map((post) => post.id);
  const profileIds = Array.from(
    new Set(
      posts.flatMap((post) =>
        post.reviewed_by ? [post.author_user_id, post.reviewed_by] : [post.author_user_id]
      )
    )
  );

  const { data: profileData } = profileIds.length
    ? await supabaseAdmin
        .from("profiles")
        .select("user_id, display_name, photo_url")
        .in("user_id", profileIds)
    : { data: [] };

  const profileMap = new Map<string, BoardUserPreview>(
    ((profileData ?? []) as ProfileRow[]).map((profile) => [
      profile.user_id,
      {
        user_id: profile.user_id,
        display_name: profile.display_name,
        photo_url: profile.photo_url,
      },
    ])
  );

  const { data: reactionData } = postIds.length
    ? await supabaseAdmin
        .from("club_board_reactions")
        .select("post_id, user_id, emoji")
        .in("post_id", postIds)
    : { data: [] };

  const reactionsByPost = new Map<string, Map<BoardReactionEmoji, number>>();
  const viewerReactionSet = new Set<string>();

  for (const reaction of (reactionData ?? []) as BoardReactionRow[]) {
    const counts = reactionsByPost.get(reaction.post_id) ?? new Map<BoardReactionEmoji, number>();
    counts.set(reaction.emoji, (counts.get(reaction.emoji) ?? 0) + 1);
    reactionsByPost.set(reaction.post_id, counts);

    if (viewerUserId && reaction.user_id === viewerUserId) {
      viewerReactionSet.add(`${reaction.post_id}:${reaction.emoji}`);
    }
  }

  const pendingPosts = posts
    .filter((post) => post.status === "pending_review")
    .map((post) => buildPostView(post, profileMap, reactionsByPost, viewerReactionSet));

  const publishedPosts = posts
    .filter((post) => post.status === "published")
    .map((post) => buildPostView(post, profileMap, reactionsByPost, viewerReactionSet));

  const featuredPost =
    publishedPosts.find((post) => post.is_pinned) ??
    publishedPosts.find(
      (post) => post.kind === "announcement" && post.importance === "important"
    ) ??
    publishedPosts[0] ??
    null;

  return {
    featuredPost,
    publishedPosts: featuredPost
      ? publishedPosts.filter((post) => post.id !== featuredPost.id)
      : publishedPosts,
    pendingPosts,
  };
}

export async function queueImportantBoardNotifications(
  post: ImportantNotificationPayload
): Promise<number> {
  if (post.kind !== "announcement" || post.importance !== "important") {
    return 0;
  }

  const [{ data: club }, { data: senderProfile }, { data: memberships }] = await Promise.all([
    supabaseAdmin.from("clubs").select("name").eq("id", post.club_id).single(),
    supabaseAdmin
      .from("profiles")
      .select("display_name")
      .eq("user_id", post.author_user_id)
      .single(),
    supabaseAdmin
      .from("club_memberships")
      .select("user_id")
      .eq("club_id", post.club_id)
      .eq("status", "active")
      .neq("user_id", post.author_user_id),
  ]);

  if (!club || !memberships || memberships.length === 0) {
    return 0;
  }

  const senderName = senderProfile?.display_name ?? "Club leader";
  const message = (post.title ? `${post.title} - ${post.body}` : post.body).slice(0, 280);
  const now = new Date().toISOString();
  const notifications = memberships.map((membership) => ({
    user_id: membership.user_id,
    channel: "in_app" as const,
    type: "club_announcement",
    payload_json: {
      board_post_id: post.id,
      club_id: post.club_id,
      club_name: club.name,
      message,
      sender_name: senderName,
    },
    send_at: now,
  }));

  const { error } = await supabaseAdmin.from("notifications").insert(notifications);
  if (error) {
    return 0;
  }

  return notifications.length;
}