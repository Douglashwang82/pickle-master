"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { CalendarDays, List, Plus } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

type Props = {
  slug: string;
  view: "list" | "calendar";
  status: "upcoming" | "past" | "cancelled" | "all";
};

export default function SessionToolbar({ slug, view, status }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function update(next: Record<string, string | null>) {
    const u = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null) u.delete(k);
      else u.set(k, v);
    }
    startTransition(() => {
      router.replace(`${pathname}?${u.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 mb-4">
      <div className="flex items-center gap-3">
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => v && update({ view: v })}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="list" aria-label="清單檢視">
            <List className="h-4 w-4" />
            <span className="ml-1.5 hidden sm:inline">清單</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="calendar" aria-label="月曆檢視">
            <CalendarDays className="h-4 w-4" />
            <span className="ml-1.5 hidden sm:inline">月曆</span>
          </ToggleGroupItem>
        </ToggleGroup>

        <Select
          value={status}
          onValueChange={(v) => update({ status: v })}
          disabled={isPending}
        >
          <SelectTrigger className="h-9 w-[120px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="upcoming">即將舉辦</SelectItem>
            <SelectItem value="past">已完成</SelectItem>
            <SelectItem value="cancelled">已取消</SelectItem>
            <SelectItem value="all">全部</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button asChild size="sm">
        <Link href={`/clubs/${slug}/sessions/new`}>
          <Plus className="h-4 w-4 mr-1" />
          建立場次
        </Link>
      </Button>
    </div>
  );
}
