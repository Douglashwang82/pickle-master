"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Props = {
  paidCount: number;
  totalCount: number;
  totalAmountTwd: number;
  paidAmountTwd: number;
};

export default function DebtProgressBar({
  paidCount,
  totalCount,
  totalAmountTwd,
  paidAmountTwd,
}: Props) {
  const percent = totalCount === 0 ? 0 : Math.round((paidCount / totalCount) * 100);
  const unpaidCount = totalCount - paidCount;
  const unpaidAmount = totalAmountTwd - paidAmountTwd;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">Payment collection</span>
        <span className="text-muted-foreground">
          {paidCount}/{totalCount} paid
        </span>
      </div>

      <Progress
        value={percent}
        className={cn("h-2", percent === 100 ? "[&>div]:bg-green-500" : "[&>div]:bg-amber-500")}
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Collected: <span className="text-foreground font-medium">NT${paidAmountTwd.toLocaleString()}</span>
        </span>
        {unpaidCount > 0 && (
          <span>
            Outstanding:{" "}
            <span className="text-amber-600 font-medium">
              NT${unpaidAmount.toLocaleString()} ({unpaidCount} member{unpaidCount !== 1 ? "s" : ""})
            </span>
          </span>
        )}
        {unpaidCount === 0 && totalCount > 0 && (
          <span className="text-green-600 font-medium">All paid</span>
        )}
      </div>
    </div>
  );
}
