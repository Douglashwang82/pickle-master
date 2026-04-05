"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Club } from "@/types/domain";

type Props = {
  club?: Pick<Club, "id" | "slug" | "name" | "description" | "rules" | "public_status">;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toSlug(value: string) {
    return value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = { name, slug, description, rules, public_status: publicStatus };
    const url = isEditing ? `/api/clubs/${club!.id}` : "/api/clubs";
    const method = isEditing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
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

          <div className="space-y-1">
            <Label htmlFor="name">Club name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!isEditing) setSlug(toSlug(e.target.value));
              }}
              placeholder="My Pickleball Club"
              required
            />
          </div>

          {!isEditing && (
            <div className="space-y-1">
              <Label htmlFor="slug">URL slug *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(toSlug(e.target.value))}
                placeholder="my-pickleball-club"
                required
                pattern="[a-z0-9-]{3,50}"
                title="3–50 lowercase letters, numbers, hyphens"
              />
              <p className="text-xs text-muted-foreground">
                picklemaster.app/clubs/{slug || "…"}
              </p>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
              placeholder="Tell players about your club…"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="rules">Club rules</Label>
            <textarea
              id="rules"
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
              placeholder="House rules, skill requirements, etc."
            />
          </div>

          <div className="space-y-1">
            <Label>Visibility</Label>
            <div className="flex gap-3">
              {(["public", "private"] as const).map((val) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="public_status"
                    value={val}
                    checked={publicStatus === val}
                    onChange={() => setPublicStatus(val)}
                    className="accent-primary"
                  />
                  <span className="text-sm capitalize">{val}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : isEditing ? "Save changes" : "Create club"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
