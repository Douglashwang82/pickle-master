"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import ReputationDisplay from "@/components/reviews/ReputationDisplay";
import { Star } from "lucide-react";
import { getSkillLabel, getSkillColor } from "@/lib/constants/skills";
import type { ClubWithDiscovery } from "@/types/domain";

type PeerReview = {
  rating: number;
  badges: string[];
  created_at: string;
  reviewer: {
    profiles: {
      display_name: string;
    } | null;
  } | null;
};

type Profile = {
  display_name: string;
  photo_url?: string | null;
  skill_level?: string | null;
  bio?: string | null;
  contact_preference?: string;
  reputation_score?: number | null;
  review_count?: number;
  peer_reviews?: PeerReview[];
};

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "1";

  const [profile, setProfile] = useState<Profile>({ display_name: "" });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [recommendedClubs, setRecommendedClubs] = useState<ClubWithDiscovery[]>([]);

  useEffect(() => {
    async function loadProfile() {
      const res = await fetch("/api/me");
      if (res.ok) {
        const data = await res.json();
        if (data.profiles) {
          setProfile({
            display_name: data.profiles.display_name ?? "",
            photo_url: data.profiles.photo_url,
            skill_level: data.profiles.skill_level,
            bio: data.profiles.bio,
            contact_preference: data.profiles.contact_preference,
            reputation_score: data.profiles.reputation_score ?? null,
            review_count: data.profiles.review_count ?? 0,
            peer_reviews: data.peer_reviews || [],
          });
        }
      }
      setFetchLoading(false);
    }
    loadProfile();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const res = await fetch("/api/me/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    if (res.ok) {
      setSuccess(true);
      // On new profile completion, fetch recommended clubs matching skill level
      if (isNew && profile.skill_level) {
        const clubsRes = await fetch(
          `/api/clubs/public?skill=${profile.skill_level}&sort=most_active&page=1`
        );
        if (clubsRes.ok) {
          const clubsData = await clubsRes.json();
          setRecommendedClubs((clubsData.clubs ?? []).slice(0, 3));
        }
      }
    } else {
      let errorMsg = "個人資料更新失敗";
      try {
        const data = await res.json();
        errorMsg = data.error ?? errorMsg;
      } catch {
        // Fallback if response is not JSON
      }
      setError(errorMsg);
    }
    setLoading(false);
  }

  if (fetchLoading) {
    return <div className="animate-pulse h-64 bg-muted rounded-xl" />;
  }

  const badgeCounts = profile.peer_reviews?.reduce((acc, review) => {
    review.badges?.forEach((badge) => {
      acc[badge] = (acc[badge] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col border-b border-border/40 pb-6">
        <div className="inline-block px-3 py-1 mb-3 self-start text-[11px] font-bold uppercase tracking-wider rounded-full bg-accent/20 text-primary">
          球員設定
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{isNew ? "完成個人資料" : "個人資料"}</h1>
        {isNew ? (
          <p className="text-muted-foreground text-lg mt-1">
            讓其他球員更了解您。
          </p>
        ) : (
          <p className="text-muted-foreground text-lg mt-1">
            管理您的個人設定並查看您的聲譽。
          </p>
        )}
      </div>

      <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="bg-secondary/30 pb-4 border-b border-border/40">
          <CardTitle className="text-lg font-bold flex items-center gap-2 tracking-tight">
            <div className="w-2 h-2 rounded-full bg-accent" />
            信譽評分
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <ReputationDisplay
            reputationScore={profile.reputation_score ?? null}
            reviewCount={profile.review_count ?? 0}
            badgeCounts={badgeCounts}
          />

          {profile.peer_reviews && profile.peer_reviews.length > 0 && (
            <div className="mt-8 border-t border-border/40 pt-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">近期評分</h3>
              {profile.peer_reviews.map((review, idx) => (
                <div key={idx} className="flex justify-between items-start text-sm border border-border/40 bg-card rounded-xl p-4 shadow-sm hover:border-primary/20 transition-colors">
                  <div className="space-y-2">
                    <div className="font-bold text-foreground">
                      {review.reviewer?.profiles?.display_name || "匿名球員"}
                    </div>
                    {review.badges && review.badges.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {review.badges.map((badge, bIdx) => (
                          <Badge key={bIdx} variant="secondary" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-accent/10 text-primary border-none">
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="text-xs font-medium text-muted-foreground pt-1">
                      {new Date(review.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 font-black text-lg text-primary bg-primary/5 px-2 py-1 rounded-md">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    {review.rating}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="bg-secondary/30 pb-4 border-b border-border/40">
          <CardTitle className="text-lg font-bold flex items-center gap-2 tracking-tight">
            <div className="w-2 h-2 rounded-full bg-primary" />
            個人資訊
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <AlertDescription>個人資料已更新。</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="display_name" className="font-bold">顯示名稱 *</Label>
              <Input
                id="display_name"
                className="rounded-xl border-border/60 bg-secondary/20 focus-visible:ring-primary shadow-inner h-11"
                value={profile.display_name}
                onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill_level" className="font-bold">技術程度</Label>
              <Select
                value={profile.skill_level ?? ""}
                onValueChange={(v) => setProfile((p) => ({ ...p, skill_level: v }))}
              >
                <SelectTrigger className="rounded-xl border-border/60 bg-secondary/20 h-11">
                  <SelectValue placeholder="選擇等級" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/60">
                  {[
                    { value: "beginner", label: "初學者" },
                    { value: "intermediate", label: "中級" },
                    { value: "advanced", label: "進階" },
                    { value: "pro", label: "職業" },
                  ].map((l) => (
                    <SelectItem key={l.value} value={l.value} className="font-medium">
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="font-bold">自我介紹</Label>
              <textarea
                id="bio"
                value={profile.bio ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                className="w-full min-h-[100px] rounded-xl border border-border/60 bg-secondary/20 px-4 py-3 text-sm resize-y focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-inner"
                placeholder="簡單介紹自己…"
                maxLength={500}
              />
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={loading} className="w-full sm:w-auto rounded-full font-bold px-8 h-12 shadow-sm transition-transform active:scale-95">
                {loading ? "儲存中…" : "儲存資料"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Recommended clubs — shown after new profile save when skill_level is set */}
      {isNew && success && recommendedClubs.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">推薦社團</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                根據您的技術程度為您推薦
              </p>
            </div>
            <Link href="/clubs" className="text-sm font-medium text-primary hover:underline">
              查看全部 →
            </Link>
          </div>

          <div className="space-y-3">
            {recommendedClubs.map((club) => (
              <Link
                key={club.id}
                href={`/clubs/${club.slug}`}
                className="block group"
              >
                <div className="flex gap-4 p-4 rounded-2xl border border-border/40 bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200">
                  {/* Mini cover */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-secondary flex items-center justify-center">
                    {club.cover_image_url ? (
                      <img
                        src={club.cover_image_url}
                        alt={club.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-primary font-black text-sm">
                        {club.name.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm group-hover:text-primary transition-colors truncate">
                      {club.name}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {club.district && (
                        <Badge variant="secondary" className="text-[10px] px-2 py-0">
                          {club.district}
                        </Badge>
                      )}
                      {club.skill_levels?.map((s) => (
                        <span
                          key={s}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getSkillColor(s)}`}
                        >
                          {getSkillLabel(s)}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      👥 {club.member_count} 位成員
                      {club.upcoming_session_count > 0 && ` · 📅 ${club.upcoming_session_count} 場即將舉辦`}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="shrink-0 self-center">
                    <span className="text-xs font-bold text-primary">查看 →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Button asChild className="w-full rounded-full font-bold" size="lg">
            <Link href="/clubs">探索更多社團</Link>
          </Button>
        </div>
      )}

      {/* On new profile, show CTA even without skill level / before save */}
      {isNew && !success && (
        <div className="text-center py-8 border border-dashed border-border/60 rounded-2xl bg-secondary/20">
          <p className="text-sm text-muted-foreground">儲存資料後，我們將為您推薦適合的社團。</p>
        </div>
      )}
    </div>
  );
}
