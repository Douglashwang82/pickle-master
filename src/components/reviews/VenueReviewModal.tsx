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
import { Label } from "@/components/ui/label";
import StarRatingInput from "./StarRatingInput";

type Ratings = {
  facilities_rating: number;
  lighting_rating: number;
  floor_rating: number;
  transport_rating: number;
};

type Props = {
  venueId: string;
  venueName: string;
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: () => void;
};

const DIMENSIONS: { key: keyof Ratings; label: string }[] = [
  { key: "facilities_rating", label: "設施品質 Facilities" },
  { key: "lighting_rating",   label: "燈光照明 Lighting" },
  { key: "floor_rating",      label: "地面狀況 Court Surface" },
  { key: "transport_rating",  label: "交通便利性 Transport" },
];

export default function VenueReviewModal({
  venueId,
  venueName,
  sessionId,
  open,
  onOpenChange,
  onSubmitted,
}: Props) {
  const [ratings, setRatings] = useState<Ratings>({
    facilities_rating: 5,
    lighting_rating: 5,
    floor_rating: 5,
    transport_rating: 5,
  });
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/venues/${venueId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        ...ratings,
        comment: comment.trim() || undefined,
      }),
    });

    if (res.ok) {
      onSubmitted();
      onOpenChange(false);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to submit review. Please try again.");
    }
    setSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rate the Venue</DialogTitle>
          <p className="text-sm text-muted-foreground">{venueName}</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {DIMENSIONS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <Label className="text-sm">{label}</Label>
              <StarRatingInput
                value={ratings[key]}
                onChange={(v) => setRatings((prev) => ({ ...prev, [key]: v }))}
                size="sm"
              />
            </div>
          ))}

          <div className="space-y-1">
            <Label htmlFor="venue-comment" className="text-sm">
              Comment (optional)
            </Label>
            <textarea
              id="venue-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Share your experience…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500
            </p>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
