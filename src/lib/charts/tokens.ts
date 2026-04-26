export const CHART_COLORS = {
  primary: "hsl(var(--chart-1))",
  success: "hsl(var(--chart-2))",
  warning: "hsl(var(--chart-3))",
  danger: "hsl(var(--chart-4))",
  muted: "hsl(var(--chart-5))",
} as const;

export type ChartColorKey = keyof typeof CHART_COLORS;

export function formatTWD(amount: number): string {
  return `NT$${amount.toLocaleString()}`;
}

export function formatCompactTWD(amount: number): string {
  if (amount >= 1_000_000) return `NT$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `NT$${Math.round(amount / 1_000)}k`;
  return `NT$${amount}`;
}

export function formatMonthLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("zh-TW", { month: "short" });
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" });
}

export function formatLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
