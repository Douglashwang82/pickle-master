"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  clubId: string;
  clubSlug: string;
  venues: { id: string; name: string; district?: string }[];
  onCancel?: () => void;
};

export default function SessionForm({ clubId, clubSlug, venues, onCancel }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    venue_id: "",
    scheduled_start_at: "",
    scheduled_end_at: "",
    duration_minutes: 90,
    capacity: 10,
    fee_twd: 0,
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/clubs/${clubId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        scheduled_start_at: new Date(form.scheduled_start_at).toISOString(),
        scheduled_end_at: new Date(form.scheduled_end_at).toISOString(),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to create session");
      setLoading(false);
      return;
    }

    router.push(`/sessions/${data.id}`);
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
            <Label htmlFor="title">Session title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Monday Casual"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="venue">Venue *</Label>
            <Select
              value={form.venue_id}
              onValueChange={(val) => set("venue_id", val)}
              required
            >
              <SelectTrigger id="venue">
                <SelectValue placeholder="Select a venue" />
              </SelectTrigger>
              <SelectContent>
                {venues.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name} {v.district ? `(${v.district})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="start">Start time *</Label>
              <Input
                id="start"
                type="datetime-local"
                value={form.scheduled_start_at}
                onChange={(e) => set("scheduled_start_at", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="end">End time *</Label>
              <Input
                id="end"
                type="datetime-local"
                value={form.scheduled_end_at}
                onChange={(e) => set("scheduled_end_at", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                max={200}
                value={form.capacity}
                onChange={(e) => set("capacity", parseInt(e.target.value, 10))}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fee">Fee (NT$)</Label>
              <Input
                id="fee"
                type="number"
                min={0}
                value={form.fee_twd}
                onChange={(e) => set("fee_twd", parseInt(e.target.value, 10))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="w-full min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
              placeholder="Equipment to bring, parking info…"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading || !form.venue_id}>
              {loading ? "Creating…" : "Create session"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onCancel ? onCancel() : router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
