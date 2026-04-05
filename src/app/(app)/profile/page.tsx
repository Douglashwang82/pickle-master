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

type Profile = {
  display_name: string;
  photo_url?: string | null;
  skill_level?: string | null;
  bio?: string | null;
  contact_preference?: string;
  reputation_score?: number | null;
  review_count?: number;
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

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isNew ? "Complete Your Profile" : "Profile"}</h1>
        {isNew && (
          <p className="text-muted-foreground text-sm mt-1">
            Tell other players a bit about yourself.
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reputation</CardTitle>
        </CardHeader>
        <CardContent>
          <ReputationDisplay
            reputationScore={profile.reputation_score ?? null}
            reviewCount={profile.review_count ?? 0}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Info</CardTitle>
        </CardHeader>
        <CardContent>
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

            <div className="space-y-1">
              <Label htmlFor="display_name">Display name *</Label>
              <Input
                id="display_name"
                value={profile.display_name}
                onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="skill_level">Skill level</Label>
              <Select
                value={profile.skill_level ?? ""}
                onValueChange={(v) => setProfile((p) => ({ ...p, skill_level: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {["beginner", "intermediate", "advanced", "pro"].map((l) => (
                    <SelectItem key={l} value={l} className="capitalize">
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                value={profile.bio ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
                placeholder="A little about yourself…"
                maxLength={500}
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
