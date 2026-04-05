"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  onChange: (value: number) => void;
  size?: "sm" | "md";
};

export default function StarRatingInput({ value, onChange, size = "md" }: Props) {
  const starSize = size === "sm" ? "h-4 w-4" : "h-6 w-6";

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none"
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              starSize,
              "transition-colors",
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "fill-transparent text-muted-foreground hover:text-yellow-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}
