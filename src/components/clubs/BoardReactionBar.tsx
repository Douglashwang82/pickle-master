"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BOARD_REACTION_LABELS } from "@/lib/board-config";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { BoardReactionEmoji, BoardReactionSummary } from "@/types/domain";

type Props = {
  clubId: string;
  postId: string;
  reactions: BoardReactionSummary[];
};

export default function BoardReactionBar({ clubId, postId, reactions }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState(reactions);
  const [pendingEmoji, setPendingEmoji] = useState<BoardReactionEmoji | null>(null);

  async function handleToggle(emoji: BoardReactionEmoji) {
    if (pendingEmoji) return;

    const previousItems = items;
    const current = items.find((item) => item.emoji === emoji);
    if (!current) return;

    const nextActive = !current.reacted;
    setPendingEmoji(emoji);
    setItems((prev) =>
      prev.map((item) =>
        item.emoji === emoji
          ? {
              ...item,
              reacted: nextActive,
              count: Math.max(0, item.count + (nextActive ? 1 : -1)),
            }
          : item
      )
    );

    try {
      const response = await fetch(`/api/clubs/${clubId}/board/${postId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji, active: nextActive }),
      });

      if (!response.ok) {
        setItems(previousItems);
        toast({
          title: "Reaction failed",
          description: "Please try again.",
          variant: "destructive",
        });
        return;
      }

      router.refresh();
    } catch {
      setItems(previousItems);
      toast({
        title: "Reaction failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPendingEmoji(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Button
          key={item.emoji}
          type="button"
          variant="outline"
          size="sm"
          disabled={pendingEmoji !== null}
          onClick={() => handleToggle(item.emoji)}
          className={cn(
            "h-8 rounded-full px-3 text-xs",
            item.reacted && "border-primary bg-primary/10 text-primary"
          )}
          aria-label={BOARD_REACTION_LABELS[item.emoji]}
        >
          <span className="mr-1">{item.emoji}</span>
          <span>{item.count}</span>
        </Button>
      ))}
    </div>
  );
}