import { z } from "zod";

export const TimeseriesQuerySchema = z.object({
  metric: z.enum(["revenue", "fill_rate", "members"]),
  granularity: z.enum(["day", "week", "month"]).default("month"),
  range: z.enum(["30d", "90d", "6m", "1y"]).default("6m"),
});

export type TimeseriesQuery = z.infer<typeof TimeseriesQuerySchema>;

export const HeatmapQuerySchema = z.object({
  range: z.enum(["30d", "90d", "1y"]).default("90d"),
});

export type HeatmapQuery = z.infer<typeof HeatmapQuerySchema>;

export const BreakdownQuerySchema = z.object({
  dimension: z.enum(["sport_type", "fee_tier", "session_revenue"]),
});

export type BreakdownQuery = z.infer<typeof BreakdownQuerySchema>;
