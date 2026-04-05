"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import StarRatingInput from "./StarRatingInput";
import BadgeSelector from "./BadgeSelector";
import type { Badge } from "@/lib/validations/reviews";

type Player = {
  user_id: string;
  display_name: string;
  photo_url: string | null;
};

type ReviewDraft = {
  rating: number;
  badges: Badge[];
};

type Props = {
  sessionId: string;
  players: Player[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: () => void;
};

export default function PeerReviewModal({
  sessionId,
  players,
  open,
  onOpenChange,
  onSubmitted,
}: Props) {
  const initialDrafts = Object.fromEntries(
    players.map((p) => [p.user_id, { rating: 5, badges: [] as Badge[] }])
  );
  const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>(initialDrafts);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateDraft(userId: string, patch: Partial<ReviewDraft>) {
    setDrafts((prev) => ({ ...prev, [userId]: { ...prev[userId], ...patch } }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const reviews = players.map((p) => ({
      reviewee_user_id: p.user_id,
      rating: drafts[p.user_id]?.rating ?? 5,
      badges: drafts[p.user_id]?.badges ?? [],
    }));

    const res = await fetch(`/api/sessions/${sessionId}/peer-reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviews }),
    });

    if (res.ok) {
      onSubmitted();
      onOpenChange(false);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to submit reviews. Please try again.");
    }
    setSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rate Your Fellow Players</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {players.map((player, i) => (
            <div key={player.user_id}>
              {i > 0 && <Separator className="mb-4" />}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {player.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{player.display_name}</span>
                </div>

                <div className="space-y-1 pl-11">
                  <p className="text-xs text-muted-foreground">Star rating</p>
                  <StarRatingInput
                    value={drafts[player.user_id]?.rating ?? 5}
                    onChange={(v) => updateDraft(player.user_id, { rating: v })}
                  />
                </div>

                <div className="space-y-1 pl-11">
                  <p className="text-xs text-muted-foreground">Badges (optional)</p>
                  <BadgeSelector
                    selected={drafts[player.user_id]?.badges ?? []}
                    onChange={(badges) => updateDraft(player.user_id, { badges })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || players.length === 0}>
            {submitting ? "Submitting…" : "Submit Reviews"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
