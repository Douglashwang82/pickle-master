"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHART_COLORS, formatCompactTWD, formatMonthLabel } from "@/lib/charts/tokens";

type Point = { x: string; y: number };
type Props = { data: Point[]; title?: string };

export default function RevenueTrendChart({
  data,
  title = "營收趨勢（近 6 個月）",
}: Props) {
  const total = data.reduce((s, p) => s + p.y, 0);
  const avg = data.length > 0 ? total / data.length : 0;
  const formatted = data.map((p) => ({ ...p, label: formatMonthLabel(p.x) }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[240px] w-full sm:h-[260px] lg:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formatted} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/60" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={11}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                tickFormatter={formatCompactTWD}
                width={56}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                contentStyle={{
                  borderRadius: "0.5rem",
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--background))",
                  fontSize: 12,
                }}
                formatter={(value) => [formatCompactTWD(Number(value)), "營收"]}
              />
              {avg > 0 && (
                <ReferenceLine
                  y={avg}
                  stroke={CHART_COLORS.muted}
                  strokeDasharray="4 4"
                  label={{
                    value: `平均 ${formatCompactTWD(Math.round(avg))}`,
                    position: "right",
                    fontSize: 10,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                />
              )}
              <Bar
                dataKey="y"
                fill={CHART_COLORS.primary}
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
