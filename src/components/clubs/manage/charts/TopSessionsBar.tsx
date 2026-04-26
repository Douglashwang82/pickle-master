"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHART_COLORS, formatCompactTWD } from "@/lib/charts/tokens";

type Segment = { label: string; value: number };
type Props = { data: Segment[]; title?: string };

export default function TopSessionsBar({
  data,
  title = "貢獻最多的場次",
}: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[220px] w-full sm:h-[240px]">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              暫無已完成場次
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/60" />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickFormatter={formatCompactTWD}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={120}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                  contentStyle={{
                    borderRadius: "0.5rem",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--background))",
                    fontSize: 12,
                  }}
                  formatter={(v) => [formatCompactTWD(Number(v)), "營收"]}
                />
                <Bar
                  dataKey="value"
                  fill={CHART_COLORS.primary}
                  radius={[0, 6, 6, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
