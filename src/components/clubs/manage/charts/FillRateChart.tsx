"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHART_COLORS, formatShortDate } from "@/lib/charts/tokens";

type Point = { x: string; y: number };
type Props = { data: Point[]; title?: string };

export default function FillRateChart({
  data,
  title = "入場率趨勢",
}: Props) {
  const formatted = data.map((p) => ({ ...p, label: formatShortDate(p.x) }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[200px] w-full sm:h-[220px] lg:h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formatted} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/60" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "0.5rem",
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--background))",
                  fontSize: 12,
                }}
                formatter={(value) => [`${Number(value)}%`, "入場率"]}
              />
              <Line
                type="monotone"
                dataKey="y"
                stroke={CHART_COLORS.primary}
                strokeWidth={2.5}
                dot={{ r: 3, fill: CHART_COLORS.primary }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
