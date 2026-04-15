"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TAIPEI_DISTRICTS } from "@/lib/constants/districts";

const SORT_OPTIONS = [
  { value: "newest", label: "最新成立" },
  { value: "most_members", label: "最多成員" },
  { value: "most_active", label: "最活躍" },
] as const;

const MEMBERSHIP_OPTIONS = [
  { value: "", label: "全部" },
  { value: "open", label: "公開加入" },
  { value: "application", label: "需申請" },
] as const;

function buildUrl(params: Record<string, string>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  sp.set("page", "1");
  const qs = sp.toString();
  return qs ? `/clubs?${qs}` : "/clubs";
}

export default function ClubFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentQ = searchParams.get("q") ?? "";
  const currentDistrict = searchParams.get("district") ?? "";
  const currentMembership = searchParams.get("membership") ?? "";
  const currentSort = searchParams.get("sort") ?? "newest";

  // Local search state for debouncing only
  const [searchInput, setSearchInput] = useState(currentQ);

  // Sync search input if URL changes externally
  useEffect(() => {
    setSearchInput(currentQ);
  }, [currentQ]);

  // Debounce search input → URL push
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== currentQ) {
        router.push(
          buildUrl({
            q: searchInput,
            district: currentDistrict,
            membership: currentMembership,
            sort: currentSort,
          })
        );
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const push = useCallback(
    (patch: Record<string, string>) => {
      router.push(
        buildUrl({
          q: currentQ,
          district: currentDistrict,
          membership: currentMembership,
          sort: currentSort,
          ...patch,
        })
      );
    },
    [router, currentQ, currentDistrict, currentMembership, currentSort]
  );

  const activeFilterCount = [currentQ, currentDistrict, currentMembership].filter(Boolean).length;

  const FilterControls = (
    <div className="flex flex-col gap-3 w-full">
      {/* District */}
      <div>
        <p className="text-xs text-muted-foreground font-medium mb-1.5">地區</p>
        <Select
          value={currentDistrict || "__all__"}
          onValueChange={(v) => push({ district: v === "__all__" ? "" : v })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="全部地區" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部地區</SelectItem>
            {TAIPEI_DISTRICTS.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Membership type */}
      <div>
        <p className="text-xs text-muted-foreground font-medium mb-1.5">加入方式</p>
        <div className="flex gap-1.5">
          {MEMBERSHIP_OPTIONS.map(({ value, label }) => (
            <Button
              key={value}
              size="sm"
              variant={currentMembership === value ? "default" : "outline"}
              className="flex-1 text-xs"
              onClick={() => push({ membership: value })}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <p className="text-xs text-muted-foreground font-medium mb-1.5">排序</p>
        <Select
          value={currentSort}
          onValueChange={(v) => push({ sort: v })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      {/* Search input — always visible */}
      <div className="relative flex-1 w-full">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <Input
          className="pl-9"
          placeholder="搜尋社團名稱…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {/* Desktop: filters inline */}
      <div className="hidden sm:flex items-center gap-2 flex-wrap">
        {/* District */}
        <Select
          value={currentDistrict || "__all__"}
          onValueChange={(v) => push({ district: v === "__all__" ? "" : v })}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="全部地區" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部地區</SelectItem>
            {TAIPEI_DISTRICTS.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Membership type toggle */}
        <div className="flex gap-1">
          {MEMBERSHIP_OPTIONS.map(({ value, label }) => (
            <Button
              key={value}
              size="sm"
              variant={currentMembership === value ? "default" : "outline"}
              className="text-xs px-3"
              onClick={() => push({ membership: value })}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Sort */}
        <Select
          value={currentSort}
          onValueChange={(v) => push({ sort: v })}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear all */}
        {activeFilterCount > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => router.push("/clubs")}
          >
            清除篩選
          </Button>
        )}
      </div>

      {/* Mobile: filter popover */}
      <div className="flex sm:hidden gap-2 w-full">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1 justify-between">
              <span>篩選</span>
              {activeFilterCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="start">
            {FilterControls}
          </PopoverContent>
        </Popover>

        {activeFilterCount > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-muted-foreground"
            onClick={() => router.push("/clubs")}
          >
            清除
          </Button>
        )}
      </div>
    </div>
  );
}
