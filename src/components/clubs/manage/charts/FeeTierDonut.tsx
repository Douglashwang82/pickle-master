"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHART_COLORS } from "@/lib/charts/tokens";

type Segment = { label: string; value: number };
type Props = { data: Segment[]; title?: string };

const PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.danger,
  CHART_COLORS.muted,
];

export default function FeeTierDonut({
  data,
  title = "場次費用分布",
}: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const filtered = data.filter((d) => d.value > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px] w-full sm:h-[240px]">
          {total === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              暫無場次資料
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filtered}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  strokeWidth={1}
                >
                  {filtered.map((_, idx) => (
                    <Cell key={idx} fill={PALETTE[idx % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "0.5rem",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--background))",
                    fontSize: 12,
                  }}
                  formatter={(v, name) => [`${Number(v)} 場`, String(name)]}
                />
                <Legend
                  iconSize={10}
                  wrapperStyle={{ fontSize: 11 }}
                  align="center"
                  verticalAlign="bottom"
                  layout="horizontal"
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
