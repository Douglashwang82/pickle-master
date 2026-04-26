"use client";

import { useMemo, useState } from "react";
import { DayPicker, type DayProps } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { buttonVariants } from "@/components/ui/button";
import SessionRow, { type SessionRowData } from "./SessionRow";

type Props = { sessions: SessionRowData[] };

function fillState(s: SessionRowData): "high" | "mid" | "low" | "cancel" {
  if (s.status === "cancelled") return "cancel";
  if (s.capacity <= 0) return "low";
  const ratio = s.confirmed_count / s.capacity;
  if (ratio >= 0.85) return "high";
  if (ratio >= 0.4) return "mid";
  return "low";
}

const DOT_CLS = {
  high: "bg-emerald-500",
  mid: "bg-amber-500",
  low: "bg-slate-400",
  cancel: "bg-red-500",
} as const;

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function SessionCalendar({ sessions }: Props) {
  const [selected, setSelected] = useState<Date | undefined>();

  const byDay = useMemo(() => {
    const m: Record<string, SessionRowData[]> = {};
    for (const s of sessions) {
      const k = dayKey(new Date(s.scheduled_start_at));
      (m[k] ??= []).push(s);
    }
    return m;
  }, [sessions]);

  const selectedDay = selected ? byDay[dayKey(selected)] ?? [] : [];

  return (
    <>
      <div className="rounded-xl border bg-card p-3 sm:p-4">
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={(d) => {
            if (d && byDay[dayKey(d)]?.length) setSelected(d);
          }}
          className="w-full"
          classNames={{
            months: "w-full",
            month: "w-full",
            month_caption: "flex justify-center py-2 relative",
            caption_label: "text-sm font-medium",
            nav: "flex items-center justify-between",
            button_previous: cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "h-8 w-8"
            ),
            button_next: cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "h-8 w-8"
            ),
            month_grid: "w-full border-collapse",
            weekdays: "flex w-full",
            weekday:
              "flex-1 text-muted-foreground text-[11px] font-normal py-1 text-center",
            week: "flex w-full mt-1",
            day: "flex-1 p-0 relative",
            day_button: cn(
              "relative w-full h-16 sm:h-20 rounded-md text-sm font-normal transition-colors",
              "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            ),
            today: "ring-1 ring-primary/50",
            selected: "bg-primary/10 text-foreground",
            outside: "text-muted-foreground/40",
          }}
          components={{
            Chevron: ({ orientation }) => {
              const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
              return <Icon className="h-4 w-4" />;
            },
            Day: (props: DayProps) => {
              const { day, modifiers, ...rest } = props;
              const k = dayKey(day.date);
              const items = byDay[k] ?? [];
              const isOutside = modifiers?.outside;
              return (
                <td {...rest} className="flex-1 p-0 relative">
                  <button
                    type="button"
                    onClick={() => items.length > 0 && setSelected(day.date)}
                    disabled={items.length === 0}
                    className={cn(
                      "relative w-full h-16 sm:h-20 rounded-md text-sm transition-colors",
                      "flex flex-col items-center justify-start pt-1.5 gap-1",
                      isOutside && "text-muted-foreground/40",
                      items.length > 0
                        ? "hover:bg-accent/50 cursor-pointer"
                        : "cursor-default",
                      modifiers?.today && "ring-1 ring-primary/50"
                    )}
                  >
                    <span className="text-sm font-medium">
                      {day.date.getDate()}
                    </span>
                    {items.length > 0 && (
                      <div className="flex gap-0.5">
                        {items.slice(0, 3).map((s, i) => (
                          <span
                            key={i}
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              DOT_CLS[fillState(s)]
                            )}
                          />
                        ))}
                        {items.length > 3 && (
                          <span className="text-[10px] text-muted-foreground ml-0.5">
                            +{items.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                </td>
              );
            },
          }}
        />
        <div className="mt-3 flex items-center justify-end gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            滿
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            半滿
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            空缺
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            已取消
          </span>
        </div>
      </div>

      <Sheet
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(undefined)}
      >
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>
              {selected
                ? selected.toLocaleDateString("zh-TW", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "long",
                  })
                : ""}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-3">
            {selectedDay.map((s) => (
              <SessionRow key={s.id} session={s} />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
