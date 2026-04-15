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
import { SKILL_LEVELS } from "@/lib/constants/skills";

const SORT_OPTIONS = [
  { value: "newest",       label: "最新成立" },
  { value: "most_members", label: "最多成員" },
  { value: "most_active",  label: "最活躍" },
  { value: "nearest",      label: "最近距離" },
] as const;

const MEMBERSHIP_OPTIONS = [
  { value: "",            label: "全部" },
  { value: "open",        label: "公開加入" },
  { value: "application", label: "需申請" },
] as const;

const RADIUS_OPTIONS = [
  { value: "1",  label: "1 km" },
  { value: "3",  label: "3 km" },
  { value: "5",  label: "5 km" },
  { value: "10", label: "10 km" },
  { value: "20", label: "20 km" },
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

type Props = {
  view: "list" | "map";
};

export default function ClubFilterBar({ view }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentQ          = searchParams.get("q")          ?? "";
  const currentDistrict   = searchParams.get("district")   ?? "";
  const currentMembership = searchParams.get("membership") ?? "";
  const currentSkill      = searchParams.get("skill")      ?? "";
  const currentSort       = searchParams.get("sort")       ?? "newest";
  const currentLat        = searchParams.get("lat")        ?? "";
  const currentLng        = searchParams.get("lng")        ?? "";
  const currentRadius     = searchParams.get("radius_km")  ?? "5";

  const [searchInput, setSearchInput]   = useState(currentQ);
  const [gpsLoading, setGpsLoading]     = useState(false);
  const [gpsError, setGpsError]         = useState(false);

  useEffect(() => { setSearchInput(currentQ); }, [currentQ]);

  // Debounce search → URL push
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== currentQ) {
        push({ q: searchInput });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const push = useCallback(
    (patch: Record<string, string>) => {
      router.push(
        buildUrl({
          q:          currentQ,
          district:   currentDistrict,
          membership: currentMembership,
          skill:      currentSkill,
          sort:       currentSort,
          lat:        currentLat,
          lng:        currentLng,
          radius_km:  currentRadius,
          view:       view,
          ...patch,
        })
      );
    },
    [router, currentQ, currentDistrict, currentMembership, currentSkill,
     currentSort, currentLat, currentLng, currentRadius, view]
  );

  function requestGps() {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    setGpsError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        push({
          lat: String(pos.coords.latitude.toFixed(6)),
          lng: String(pos.coords.longitude.toFixed(6)),
          sort: "nearest",
        });
        setGpsLoading(false);
      },
      () => {
        setGpsError(true);
        setGpsLoading(false);
      },
      { timeout: 8000 }
    );
  }

  function clearGps() {
    push({ lat: "", lng: "", sort: currentSort === "nearest" ? "newest" : currentSort });
  }

  const hasGps     = !!(currentLat && currentLng);
  const activeFilterCount = [
    currentQ, currentDistrict, currentMembership, currentSkill, hasGps ? "gps" : "",
  ].filter(Boolean).length;

  // Reusable filter controls (used in both desktop inline and mobile popover)
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

      {/* Skill level */}
      <div>
        <p className="text-xs text-muted-foreground font-medium mb-1.5">技術程度</p>
        <Select
          value={currentSkill || "__all__"}
          onValueChange={(v) => push({ skill: v === "__all__" ? "" : v })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="全部程度" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部程度</SelectItem>
            {SKILL_LEVELS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
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

      {/* GPS proximity */}
      <div>
        <p className="text-xs text-muted-foreground font-medium mb-1.5">距離篩選</p>
        {hasGps ? (
          <div className="flex gap-2">
            <Select
              value={currentRadius}
              onValueChange={(v) => push({ radius_km: v })}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RADIUS_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={clearGps} className="shrink-0 text-xs">
              清除位置
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={requestGps}
            disabled={gpsLoading}
            className="w-full text-xs"
          >
            {gpsLoading ? "定位中…" : gpsError ? "⚠️ 無法取得位置" : "📍 使用我的位置"}
          </Button>
        )}
      </div>

      {/* Sort */}
      <div>
        <p className="text-xs text-muted-foreground font-medium mb-1.5">排序</p>
        <Select value={currentSort} onValueChange={(v) => push({ sort: v })}>
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
    <div className="space-y-3">
      {/* Top row: search + view toggle */}
      <div className="flex gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <Input
            className="pl-9"
            placeholder="搜尋社團名稱…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        {/* View toggle: list / map */}
        <div className="flex rounded-lg border border-border/60 overflow-hidden shrink-0">
          <button
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              view === "list"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-secondary"
            }`}
            onClick={() => push({ view: "list" })}
          >
            ☰ 列表
          </button>
          <button
            className={`px-3 py-2 text-xs font-medium transition-colors border-l border-border/60 ${
              view === "map"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-secondary"
            }`}
            onClick={() => push({ view: "map" })}
          >
            🗺 地圖
          </button>
        </div>
      </div>

      {/* Second row: desktop inline filters */}
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

        {/* Skill level */}
        <Select
          value={currentSkill || "__all__"}
          onValueChange={(v) => push({ skill: v === "__all__" ? "" : v })}
        >
          <SelectTrigger className="w-28">
            <SelectValue placeholder="全部程度" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部程度</SelectItem>
            {SKILL_LEVELS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Membership toggle */}
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

        {/* GPS */}
        {hasGps ? (
          <div className="flex gap-1 items-center">
            <Select
              value={currentRadius}
              onValueChange={(v) => push({ radius_km: v })}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RADIUS_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" onClick={clearGps} className="text-xs text-muted-foreground">
              × 清除
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={requestGps}
            disabled={gpsLoading}
            className="text-xs"
          >
            {gpsLoading ? "定位中…" : gpsError ? "⚠️ 失敗" : "📍 附近"}
          </Button>
        )}

        {/* Sort */}
        <Select value={currentSort} onValueChange={(v) => push({ sort: v })}>
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
            onClick={() => router.push(`/clubs${view === "map" ? "?view=map" : ""}`)}
          >
            清除篩選
          </Button>
        )}
      </div>

      {/* Mobile popover */}
      <div className="flex sm:hidden gap-2">
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
            onClick={() => router.push(`/clubs${view === "map" ? "?view=map" : ""}`)}
          >
            清除
          </Button>
        )}
      </div>
    </div>
  );
}
