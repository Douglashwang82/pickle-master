"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReputationDisplay from "@/components/reviews/ReputationDisplay";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

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
    } else {
      let errorMsg = "Failed to update profile";
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
          Player Settings
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{isNew ? "Complete Your Profile" : "Profile"}</h1>
        {isNew ? (
          <p className="text-muted-foreground text-lg mt-1">
            Tell other players a bit about yourself.
          </p>
        ) : (
          <p className="text-muted-foreground text-lg mt-1">
            Manage your personal settings and trace your reputation.
          </p>
        )}
      </div>

      <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="bg-secondary/30 pb-4 border-b border-border/40">
          <CardTitle className="text-lg font-bold flex items-center gap-2 tracking-tight">
            <div className="w-2 h-2 rounded-full bg-accent" />
            Reputation
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
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Recent Ratings</h3>
              {profile.peer_reviews.map((review, idx) => (
                <div key={idx} className="flex justify-between items-start text-sm border border-border/40 bg-card rounded-xl p-4 shadow-sm hover:border-primary/20 transition-colors">
                  <div className="space-y-2">
                    <div className="font-bold text-foreground">
                      {review.reviewer?.profiles?.display_name || "Anonymous Player"}
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
            Personal Info
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
                <AlertDescription>Profile updated.</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="display_name" className="font-bold">Display name *</Label>
              <Input
                id="display_name"
                className="rounded-xl border-border/60 bg-secondary/20 focus-visible:ring-primary shadow-inner h-11"
                value={profile.display_name}
                onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill_level" className="font-bold">Skill level</Label>
              <Select
                value={profile.skill_level ?? ""}
                onValueChange={(v) => setProfile((p) => ({ ...p, skill_level: v }))}
              >
                <SelectTrigger className="rounded-xl border-border/60 bg-secondary/20 h-11">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/60">
                  {["beginner", "intermediate", "advanced", "pro"].map((l) => (
                    <SelectItem key={l} value={l} className="capitalize font-medium">
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="font-bold">Bio</Label>
              <textarea
                id="bio"
                value={profile.bio ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                className="w-full min-h-[100px] rounded-xl border border-border/60 bg-secondary/20 px-4 py-3 text-sm resize-y focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-inner"
                placeholder="A little about yourself…"
                maxLength={500}
              />
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={loading} className="w-full sm:w-auto rounded-full font-bold px-8 h-12 shadow-sm transition-transform active:scale-95">
                {loading ? "Saving…" : "Save profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
