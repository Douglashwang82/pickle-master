import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Props = {
  reputationScore: number | null;
  reviewCount: number;
  badgeCounts?: Record<string, number>;
};

export default function ReputationDisplay({
  reputationScore,
  reviewCount,
  badgeCounts,
}: Props) {
  if (reviewCount === 0) {
    return (
      <p className="text-sm text-muted-foreground">No reviews yet.</p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="font-semibold text-sm">
          {reputationScore?.toFixed(1) ?? "—"}
        </span>
        <span className="text-xs text-muted-foreground">
          ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
        </span>
      </div>

      {badgeCounts && Object.keys(badgeCounts).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(badgeCounts).map(([badge, count]) => (
            <Badge key={badge} variant="secondary" className="text-xs">
              {badge} ×{count}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
