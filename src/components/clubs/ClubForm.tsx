"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CoverImageUpload from "@/components/clubs/CoverImageUpload";
import { TAIPEI_DISTRICTS } from "@/lib/constants/districts";
import { SKILL_LEVELS } from "@/lib/constants/skills";
import type { Club } from "@/types/domain";

type Props = {
  club?: Pick<
    Club,
    "id" | "slug" | "name" | "description" | "rules" | "public_status" | "cover_image_url"
  > & {
    district?: string | null;
    membership_type?: string | null;
    skill_levels?: string[] | null;
    latitude?: number | null;
    longitude?: number | null;
  };
};

export default function ClubForm({ club }: Props) {
  const router = useRouter();
  const isEditing = !!club;

  const [name, setName] = useState(club?.name ?? "");
  const [slug, setSlug] = useState(club?.slug ?? "");
  const [description, setDescription] = useState(club?.description ?? "");
  const [rules, setRules] = useState(club?.rules ?? "");
  const [publicStatus, setPublicStatus] = useState<"public" | "private">(
    club?.public_status === "private" ? "private" : "public"
  );
  const [coverImageUrl, setCoverImageUrl] = useState<string>(
    club?.cover_image_url ?? ""
  );
  const [district, setDistrict] = useState<string>(club?.district ?? "");
  const [membershipType, setMembershipType] = useState<"open" | "application">(
    club?.membership_type === "open" ? "open" : "application"
  );
  const [skillLevels, setSkillLevels] = useState<string[]>(
    club?.skill_levels ?? []
  );
  const [latitude, setLatitude] = useState<string>(
    club?.latitude != null ? String(club.latitude) : ""
  );
  const [longitude, setLongitude] = useState<string>(
    club?.longitude != null ? String(club.longitude) : ""
  );
  const [gpsLoading, setGpsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toSlug(value: string) {
    return value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  function toggleSkillLevel(value: string) {
    setSkillLevels((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function detectLocation() {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(String(pos.coords.latitude.toFixed(6)));
        setLongitude(String(pos.coords.longitude.toFixed(6)));
        setGpsLoading(false);
      },
      () => setGpsLoading(false)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      name,
      slug,
      description,
      rules,
      public_status: publicStatus,
      cover_image_url: coverImageUrl || undefined,
      district: district || undefined,
      membership_type: membershipType,
      skill_levels: skillLevels,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
    };
    const url = isEditing ? `/api/clubs/${club!.id}` : "/api/clubs";
    const method = isEditing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "發生錯誤");
      setLoading(false);
      return;
    }

    router.push(`/clubs/${data.slug}`);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Cover image */}
          <div className="space-y-1">
            <Label>封面圖片</Label>
            <CoverImageUpload
              currentUrl={coverImageUrl || null}
              onUpload={(url) => setCoverImageUrl(url)}
              onRemove={() => setCoverImageUrl("")}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="name">社團名稱 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!isEditing) setSlug(toSlug(e.target.value));
              }}
              placeholder="我的匹克球社團"
              required
            />
          </div>

          {!isEditing && (
            <div className="space-y-1">
              <Label htmlFor="slug">網址代碼 *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(toSlug(e.target.value))}
                placeholder="my-pickleball-club"
                required
                pattern="[a-z0-9-]{3,50}"
                title="3–50 個小寫字母、數字或連字號"
              />
              <p className="text-xs text-muted-foreground">
                picklemaster.app/clubs/{slug || "…"}
              </p>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="description">描述</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
              placeholder="介紹您的社團…"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="rules">社團規則</Label>
            <textarea
              id="rules"
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
              placeholder="場地規則、技術要求等。"
            />
          </div>

          <div className="space-y-1">
            <Label>公開設定</Label>
            <div className="flex gap-3">
              {([
                { value: "public", label: "公開" },
                { value: "private", label: "私人" },
              ] as const).map(({ value: val, label }) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="public_status"
                    value={val}
                    checked={publicStatus === val}
                    onChange={() => setPublicStatus(val)}
                    className="accent-primary"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label>地區</Label>
            <Select value={district} onValueChange={setDistrict}>
              <SelectTrigger>
                <SelectValue placeholder="請選擇地區（選填）" />
              </SelectTrigger>
              <SelectContent>
                {TAIPEI_DISTRICTS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Skill levels — checkboxes, 2×2 grid */}
          <div className="space-y-1">
            <Label>適合程度（可複選）</Label>
            <p className="text-xs text-muted-foreground">不選擇代表歡迎所有程度</p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {SKILL_LEVELS.map(({ value, label, color }) => (
                <label
                  key={value}
                  className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border transition-colors ${
                    skillLevels.includes(value)
                      ? "border-primary bg-primary/5"
                      : "border-border/60 hover:border-primary/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={skillLevels.includes(value)}
                    onChange={() => toggleSkillLevel(value)}
                    className="accent-primary"
                  />
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1">
            <Label>場地座標（用於地圖顯示）</Label>
            <div className="flex gap-2">
              <Input
                placeholder="緯度 (lat)"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="flex-1"
                type="number"
                step="any"
              />
              <Input
                placeholder="經度 (lng)"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="flex-1"
                type="number"
                step="any"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={detectLocation}
                disabled={gpsLoading}
                className="shrink-0"
              >
                {gpsLoading ? "偵測中…" : "📍 使用目前位置"}
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label>加入方式</Label>
            <div className="flex gap-3">
              {([
                { value: "application", label: "需要申請（社長審核）" },
                { value: "open", label: "公開加入（立即加入）" },
              ] as const).map(({ value: val, label }) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="membership_type"
                    value={val}
                    checked={membershipType === val}
                    onChange={() => setMembershipType(val)}
                    className="accent-primary"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "儲存中…" : isEditing ? "儲存變更" : "創建社團"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              取消
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
