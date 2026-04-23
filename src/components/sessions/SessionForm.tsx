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
import SessionImageUpload from "@/components/sessions/SessionImageUpload";

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
    image_url: null as string | null,
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

    const startAt = new Date(form.scheduled_start_at);
    const endAt = new Date(form.scheduled_end_at);

    if (startAt.getTime() < Date.now()) {
      setError("開始時間不能早於現在");
      setLoading(false);
      return;
    }

    if (endAt.getTime() <= startAt.getTime()) {
      setError("結束時間必須晚於開始時間");
      setLoading(false);
      return;
    }

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
      setError(data.error ?? "場次建立失敗");
      setLoading(false);
      return;
    }

    onCancel?.();
    router.replace(`/clubs/${clubSlug}?tab=sessions`);
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
            <Label htmlFor="title">場次名稱 *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="週一休閒賽"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Event image</Label>
            <SessionImageUpload
              currentUrl={form.image_url}
              onUpload={(url) => set("image_url", url)}
              onRemove={() => set("image_url", null)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="venue">場地 *</Label>
            <Select
              value={form.venue_id}
              onValueChange={(val) => set("venue_id", val)}
              required
            >
              <SelectTrigger id="venue">
                <SelectValue placeholder="選擇場地" />
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
              <Label htmlFor="start">開始時間 *</Label>
              <Input
                id="start"
                type="datetime-local"
                value={form.scheduled_start_at}
                onChange={(e) => set("scheduled_start_at", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="end">結束時間 *</Label>
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
              <Label htmlFor="capacity">人數上限 *</Label>
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
              <Label htmlFor="fee">費用（新台幣）</Label>
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
            <Label htmlFor="notes">備註</Label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="w-full min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
              placeholder="攜帶裝備、停車資訊等…"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading || !form.venue_id}>
              {loading ? "建立中…" : "建立場次"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onCancel ? onCancel() : router.back()}>
              取消
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
