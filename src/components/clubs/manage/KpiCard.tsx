"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { CHART_COLORS } from "@/lib/charts/tokens";

type Props = {
  label: string;
  value: string;
  delta?: { current: number; previous: number; suffix?: string } | null;
  spark?: Array<{ x: string; y: number }>;
  accent?: "primary" | "success" | "warning" | "danger" | "muted";
};

const ACCENT_CLS: Record<NonNullable<Props["accent"]>, string> = {
  primary: "text-emerald-600",
  success: "text-green-600",
  warning: "text-amber-600",
  danger: "text-red-500",
  muted: "text-slate-500",
};

export default function KpiCard({
  label,
  value,
  delta,
  spark,
  accent = "primary",
}: Props) {
  const color =
    accent === "primary"
      ? CHART_COLORS.primary
      : accent === "success"
        ? CHART_COLORS.success
        : accent === "warning"
          ? CHART_COLORS.warning
          : accent === "danger"
            ? CHART_COLORS.danger
            : CHART_COLORS.muted;

  let pct: number | null = null;
  if (delta && delta.previous > 0) {
    pct = Math.round(((delta.current - delta.previous) / delta.previous) * 100);
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="flex items-end justify-between gap-3">
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {spark && spark.length > 1 && (
            <div className="h-8 w-20 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spark}>
                  <Line
                    type="monotone"
                    dataKey="y"
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        {pct !== null && (
          <p
            className={cn(
              "text-xs font-medium",
              pct >= 0 ? ACCENT_CLS.success : ACCENT_CLS.danger
            )}
          >
            {pct >= 0 ? "▲" : "▼"} {Math.abs(pct)}% 較上期
          </p>
        )}
        {pct === null && delta && delta.previous === 0 && delta.current > 0 && (
          <p className="text-xs font-medium text-emerald-600">▲ 新增</p>
        )}
      </CardContent>
    </Card>
  );
}
