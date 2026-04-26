"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { TAIPEI_DISTRICTS } from "@/lib/constants/districts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORT_OPTIONS = [
  { value: "soonest", label: "最早開始" },
  { value: "newest", label: "最新建立" },
  { value: "lowest_fee", label: "費用最低" },
  { value: "highest_fee", label: "費用最高" },
] as const;

const PRICE_OPTIONS = [
  { value: "", label: "全部費用" },
  { value: "free", label: "免費" },
  { value: "paid", label: "付費" },
] as const;

const AVAILABILITY_OPTIONS = [
  { value: "", label: "全部名額" },
  { value: "open", label: "仍可加入" },
  { value: "full", label: "已額滿" },
] as const;

function buildUrl(params: Record<string, string>) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) sp.set(key, value);
  }
  sp.set("page", "1");
  const qs = sp.toString();
  return qs ? `/sessions?${qs}` : "/sessions";
}

type Props = {
  view: "list" | "map";
};

export default function PublicSessionSearch({ view }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentQ = searchParams.get("q") ?? "";
  const currentDistrict = searchParams.get("district") ?? "";
  const currentPrice = searchParams.get("price") ?? "";
  const currentAvailability = searchParams.get("availability") ?? "";
  const currentSort = searchParams.get("sort") ?? "soonest";

  const [searchInput, setSearchInput] = useState(currentQ);

  useEffect(() => {
    setSearchInput(currentQ);
  }, [currentQ]);

  const push = useCallback(
    (patch: Record<string, string>) => {
      router.push(
        buildUrl({
          q: currentQ,
          district: currentDistrict,
          price: currentPrice,
          availability: currentAvailability,
          sort: currentSort,
          view,
          ...patch,
        })
      );
    },
    [router, currentQ, currentDistrict, currentPrice, currentAvailability, currentSort, view]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== currentQ) {
        push({ q: searchInput });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, currentQ, push]);

  const activeFilterCount = [
    currentQ,
    currentDistrict,
    currentPrice,
    currentAvailability,
  ].filter(Boolean).length;

  const filterControls = (
    <div className="flex w-full flex-col gap-3">
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">地區</p>
        <Select
          value={currentDistrict || "__all__"}
          onValueChange={(value) => push({ district: value === "__all__" ? "" : value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="全部地區" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部地區</SelectItem>
            {TAIPEI_DISTRICTS.map((district) => (
              <SelectItem key={district} value={district}>
                {district}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">費用</p>
        <div className="flex gap-1.5">
          {PRICE_OPTIONS.map(({ value, label }) => (
            <Button
              key={value}
              size="sm"
              variant={currentPrice === value ? "default" : "outline"}
              className="flex-1 text-xs"
              onClick={() => push({ price: value })}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">名額狀態</p>
        <div className="flex gap-1.5">
          {AVAILABILITY_OPTIONS.map(({ value, label }) => (
            <Button
              key={value}
              size="sm"
              variant={currentAvailability === value ? "default" : "outline"}
              className="flex-1 text-xs"
              onClick={() => push({ availability: value })}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">排序</p>
        <Select value={currentSort} onValueChange={(value) => push({ sort: value })}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="搜尋場次名稱或地點..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div className="flex shrink-0 overflow-hidden rounded-lg border border-border/60">
          <button
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              view === "list"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-secondary"
            }`}
            onClick={() => push({ view: "list" })}
            type="button"
          >
            ☰ 列表
          </button>
          <button
            className={`border-l border-border/60 px-3 py-2 text-xs font-medium transition-colors ${
              view === "map"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-secondary"
            }`}
            onClick={() => push({ view: "map" })}
            type="button"
          >
            🗺 地圖
          </button>
        </div>
      </div>

      <div className="hidden flex-wrap items-center gap-2 sm:flex">
        <Select
          value={currentDistrict || "__all__"}
          onValueChange={(value) => push({ district: value === "__all__" ? "" : value })}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="全部地區" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部地區</SelectItem>
            {TAIPEI_DISTRICTS.map((district) => (
              <SelectItem key={district} value={district}>
                {district}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-1">
          {PRICE_OPTIONS.map(({ value, label }) => (
            <Button
              key={value}
              size="sm"
              variant={currentPrice === value ? "default" : "outline"}
              className="px-3 text-xs"
              onClick={() => push({ price: value })}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="flex gap-1">
          {AVAILABILITY_OPTIONS.map(({ value, label }) => (
            <Button
              key={value}
              size="sm"
              variant={currentAvailability === value ? "default" : "outline"}
              className="px-3 text-xs"
              onClick={() => push({ availability: value })}
            >
              {label}
            </Button>
          ))}
        </div>

        <Select value={currentSort} onValueChange={(value) => push({ sort: value })}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeFilterCount > 0 ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => router.push(`/sessions${view === "map" ? "?view=map" : ""}`)}
          >
            清除篩選
          </Button>
        ) : null}
      </div>

      <div className="flex gap-2 sm:hidden">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1 justify-between">
              <span>篩選</span>
              {activeFilterCount > 0 ? (
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="start">
            {filterControls}
          </PopoverContent>
        </Popover>

        {activeFilterCount > 0 ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-muted-foreground"
            onClick={() => router.push(`/sessions${view === "map" ? "?view=map" : ""}`)}
          >
            清除
          </Button>
        ) : null}
      </div>
    </div>
  );
}
