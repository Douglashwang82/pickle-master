"use client";

import { VALID_BADGES, type Badge } from "@/lib/validations/reviews";
import { cn } from "@/lib/utils";

type Props = {
  selected: Badge[];
  onChange: (badges: Badge[]) => void;
};

export default function BadgeSelector({ selected, onChange }: Props) {
  function toggle(badge: Badge) {
    if (selected.includes(badge)) {
      onChange(selected.filter((b) => b !== badge));
    } else {
      onChange([...selected, badge]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {VALID_BADGES.map((badge) => {
        const active = selected.includes(badge);
        return (
          <button
            key={badge}
            type="button"
            onClick={() => toggle(badge)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
            )}
          >
            {badge}
          </button>
        );
      })}
    </div>
  );
}
