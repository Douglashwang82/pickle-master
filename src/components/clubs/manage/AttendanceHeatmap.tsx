"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  matrix: number[][];
  max: number;
  title?: string;
};

const DAYS = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

function intensity(value: number, max: number): string {
  if (max === 0 || value === 0) return "bg-muted/40";
  const ratio = value / max;
  if (ratio < 0.2) return "bg-emerald-100 dark:bg-emerald-950";
  if (ratio < 0.4) return "bg-emerald-200 dark:bg-emerald-900";
  if (ratio < 0.6) return "bg-emerald-300 dark:bg-emerald-800";
  if (ratio < 0.8) return "bg-emerald-500 dark:bg-emerald-700";
  return "bg-emerald-700 dark:bg-emerald-500";
}

export default function AttendanceHeatmap({
  matrix,
  max,
  title = "出席熱力圖（按星期 × 時段）",
}: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            {/* hour header */}
            <div className="grid grid-cols-[44px_repeat(24,minmax(0,1fr))] gap-1 mb-1 text-[10px] text-muted-foreground">
              <div />
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="text-center">
                  {h % 3 === 0 ? h : ""}
                </div>
              ))}
            </div>
            {matrix.map((row, dayIdx) => (
              <div
                key={dayIdx}
                className="grid grid-cols-[44px_repeat(24,minmax(0,1fr))] gap-1 mb-1"
              >
                <div className="text-[11px] text-muted-foreground self-center">
                  {DAYS[dayIdx]}
                </div>
                {row.map((cell, h) => (
                  <div
                    key={h}
                    title={`${DAYS[dayIdx]} ${h}:00 — ${cell} 人次`}
                    className={cn(
                      "aspect-square rounded-[3px]",
                      intensity(cell, max)
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
          <span>少</span>
          <span className="size-3 rounded-[3px] bg-muted/40" />
          <span className="size-3 rounded-[3px] bg-emerald-200 dark:bg-emerald-900" />
          <span className="size-3 rounded-[3px] bg-emerald-300 dark:bg-emerald-800" />
          <span className="size-3 rounded-[3px] bg-emerald-500 dark:bg-emerald-700" />
          <span className="size-3 rounded-[3px] bg-emerald-700 dark:bg-emerald-500" />
          <span>多</span>
        </div>
      </CardContent>
    </Card>
  );
}
