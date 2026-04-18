"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import BoardComposerDialog from "@/components/clubs/BoardComposerDialog";
import BoardReactionBar from "@/components/clubs/BoardReactionBar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { BoardPostWithMeta, ClubBoardData } from "@/types/domain";

type Props = {
  clubId: string;
  clubName: string;
  isLeader: boolean;
  boardData: ClubBoardData;
};

function dateParts(dateValue: string | null, fallback: string) {
  const source = dateValue ?? fallback;
  return {
    month: format(new Date(source), "MMM").toUpperCase(),
    day: format(new Date(source), "dd"),
  };
}

function kindLabel(post: BoardPostWithMeta) {
  return post.kind === "announcement" ? "Announcement" : "Note";
}

function authorName(post: BoardPostWithMeta) {
  return post.author?.display_name ?? "Club member";
}

function displayTitle(post: BoardPostWithMeta) {
  if (post.title) return post.title;
  return post.body.length > 72 ? `${post.body.slice(0, 72)}...` : post.body;
}

function BoardPostCard({
  clubId,
  post,
  isLeader,
  onPinToggle,
}: {
  clubId: string;
  post: BoardPostWithMeta;
  isLeader: boolean;
  onPinToggle: (post: BoardPostWithMeta) => Promise<void>;
}) {
  const publishedAt = post.published_at ?? post.created_at;

  return (
    <article className="grid gap-4 border-t border-border/70 pt-5 md:grid-cols-[84px_1fr]">
      <div className="hidden text-center md:block">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground">
          {dateParts(post.published_at, post.created_at).month}
        </p>
        <p className="mt-1 text-4xl font-black tracking-tight text-foreground">
          {dateParts(post.published_at, post.created_at).day}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant={post.kind === "announcement" ? "default" : "secondary"}>
                {kindLabel(post)}
              </Badge>
              {post.importance === "important" && <Badge variant="outline">Important</Badge>}
              {post.is_pinned && <Badge variant="outline">Pinned</Badge>}
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight text-foreground">{displayTitle(post)}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {authorName(post)} · {format(new Date(publishedAt), "PPP")}
              </p>
            </div>
          </div>

          {isLeader && (
            <Button variant="outline" size="sm" onClick={() => onPinToggle(post)}>
              {post.is_pinned ? "Unpin" : "Pin"}
            </Button>
          )}
        </div>

        {post.title && <p className="text-sm leading-7 text-foreground">{post.body}</p>}
        {!post.title && <p className="text-sm leading-7 text-foreground">{post.body}</p>}

        <BoardReactionBar clubId={clubId} postId={post.id} reactions={post.reactions} />
      </div>
    </article>
  );
}

export default function ClubBoardSection({ clubId, clubName, isLeader, boardData }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const { featuredPost, publishedPosts, pendingPosts } = boardData;

  async function handleReview(postId: string, decision: "approve" | "reject") {
    setBusyId(postId);

    try {
      const response = await fetch(`/api/clubs/${clubId}/board/${postId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          rejection_reason:
            decision === "reject" ? "Not aligned with the current club board priorities." : undefined,
        }),
      });

      const data: unknown = await response.json();
      if (!response.ok) {
        const message =
          data && typeof data === "object" && "error" in data
            ? String((data as { error: unknown }).error)
            : "Unable to review board post";
        toast({ title: "Review failed", description: message, variant: "destructive" });
        return;
      }

      const queuedNotifications =
        data && typeof data === "object" && "queuedNotifications" in data
          ? Number((data as { queuedNotifications: unknown }).queuedNotifications)
          : 0;

      toast({
        title: decision === "approve" ? "Post published" : "Submission rejected",
        description:
          decision === "approve" && queuedNotifications > 0
            ? `Notified ${queuedNotifications} members.`
            : decision === "approve"
              ? "The board has been updated."
              : "The submitter can try again with edits.",
      });
      router.refresh();
    } catch {
      toast({
        title: "Review failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handlePinToggle(post: BoardPostWithMeta) {
    setBusyId(post.id);

    try {
      const response = await fetch(`/api/clubs/${clubId}/board/${post.id}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pinned: !post.is_pinned }),
      });

      if (!response.ok) {
        toast({
          title: "Pin update failed",
          description: "Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: post.is_pinned ? "Post unpinned" : "Post pinned",
        description: post.is_pinned
          ? "It will return to the normal board flow."
          : "It now anchors the top of the board.",
      });
      router.refresh();
    } catch {
      toast({
        title: "Pin update failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  }

  const hasPublishedPosts = Boolean(featuredPost) || publishedPosts.length > 0;

  return (
    <section className="rounded-[28px] border border-border/70 bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Club Board
          </p>
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tight text-foreground">Latest from {clubName}</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Important announcements, shared notes, and leader-approved updates for active members.
            </p>
          </div>
        </div>

        <BoardComposerDialog clubId={clubId} isLeader={isLeader} />
      </div>

      {isLeader && pendingPosts.length > 0 && (
        <div className="mt-6 rounded-3xl border border-border/70 bg-muted/40 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Pending review</p>
              <p className="text-sm text-muted-foreground">
                {pendingPosts.length} member submission{pendingPosts.length > 1 ? "s" : ""} waiting.
              </p>
            </div>
            <Badge variant="secondary">{pendingPosts.length} pending</Badge>
          </div>

          <div className="mt-4 space-y-3">
            {pendingPosts.map((post) => (
              <div
                key={post.id}
                className={cn(
                  "rounded-2xl border border-border bg-background p-4",
                  busyId === post.id && "opacity-70"
                )}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.author?.photo_url ?? undefined} />
                        <AvatarFallback>{authorName(post).slice(0, 1)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">{authorName(post)}</p>
                        <p className="text-sm text-muted-foreground">
                          {kindLabel(post)} · {format(new Date(post.created_at), "PPP")}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">Pending review</Badge>
                        {post.importance === "important" && <Badge variant="outline">Important</Badge>}
                      </div>
                      <h3 className="text-lg font-black tracking-tight text-foreground">
                        {displayTitle(post)}
                      </h3>
                      <p className="text-sm leading-7 text-foreground">{post.body}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      disabled={busyId === post.id}
                      onClick={() => handleReview(post.id, "reject")}
                    >
                      Reject
                    </Button>
                    <Button disabled={busyId === post.id} onClick={() => handleReview(post.id, "approve")}>
                      Approve
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 space-y-5">
        {featuredPost && (
          <article className="rounded-[30px] border border-border bg-background px-5 py-6 shadow-sm sm:px-6">
            <div className="grid gap-5 md:grid-cols-[120px_1fr]">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.28em] text-muted-foreground">
                  FEATURED
                </p>
                <p className="mt-4 text-5xl font-black leading-none tracking-tight text-foreground">
                  {dateParts(featuredPost.published_at, featuredPost.created_at).day}
                </p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  {dateParts(featuredPost.published_at, featuredPost.created_at).month}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge>{kindLabel(featuredPost)}</Badge>
                      <Badge variant="outline">Pinned</Badge>
                      {featuredPost.importance === "important" && (
                        <Badge variant="outline">Important</Badge>
                      )}
                    </div>

                    <div>
                      <h3 className="text-3xl font-black tracking-tight text-foreground">
                        {displayTitle(featuredPost)}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {authorName(featuredPost)} · {format(new Date(featuredPost.published_at ?? featuredPost.created_at), "PPP")}
                      </p>
                    </div>
                  </div>

                  {isLeader && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === featuredPost.id}
                      onClick={() => handlePinToggle(featuredPost)}
                    >
                      Unpin
                    </Button>
                  )}
                </div>

                <p className="max-w-3xl text-sm leading-7 text-foreground">{featuredPost.body}</p>
                <BoardReactionBar
                  clubId={clubId}
                  postId={featuredPost.id}
                  reactions={featuredPost.reactions}
                />
              </div>
            </div>
          </article>
        )}

        {hasPublishedPosts ? (
          <div className="space-y-0">
            {publishedPosts.map((post, index) => (
              <div key={post.id}>
                <BoardPostCard
                  clubId={clubId}
                  post={post}
                  isLeader={isLeader}
                  onPinToggle={handlePinToggle}
                />
                {index < publishedPosts.length - 1 && <Separator className="mt-5" />}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border/70 px-5 py-10 text-center">
            <p className="text-lg font-semibold text-foreground">No published board posts yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {isLeader
                ? "Publish the first announcement or note for your members."
                : "Submit the first note or announcement request for leader approval."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}