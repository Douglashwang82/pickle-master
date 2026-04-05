"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

export default function ApplyPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [introMessage, setIntroMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // First resolve slug to clubId
    const clubRes = await fetch(`/api/clubs/${slug}`);
    if (!clubRes.ok) {
      setError("Club not found");
      setLoading(false);
      return;
    }
    const club = await clubRes.json();

    const res = await fetch(`/api/clubs/${club.id}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intro_message: introMessage }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to submit application");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <Alert>
          <AlertDescription>
            Application submitted! The club leader will review it and get back to you.
          </AlertDescription>
        </Alert>
        <Button variant="link" onClick={() => router.push(`/clubs/${slug}`)} className="mt-4">
          Back to club
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Apply to Join</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tell the leader about yourself</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1">
              <Label htmlFor="intro">Introduction (optional)</Label>
              <textarea
                id="intro"
                value={introMessage}
                onChange={(e) => setIntroMessage(e.target.value)}
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
                placeholder="Why do you want to join? What's your skill level?"
                maxLength={500}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting…" : "Submit application"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
