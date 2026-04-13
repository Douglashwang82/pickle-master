"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Megaphone, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Props = {
  clubId: string;
  memberCount: number; // total active members including leader
};

const CHAR_LIMIT = 500;

export default function AnnounceDialog({ clubId, memberCount }: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Leader won't receive their own announcement
  const recipientCount = Math.max(0, memberCount - 1);

  function handleOpen(next: boolean) {
    setOpen(next);
    if (!next) {
      setMessage("");
      setError(null);
    }
  }

  async function handleSend() {
    if (!message.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/clubs/${clubId}/announce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        const errMsg =
          data && typeof data === "object" && "error" in data
            ? String((data as { error: unknown }).error)
            : "Failed to send announcement";
        setError(errMsg);
        return;
      }

      const queued =
        data && typeof data === "object" && "queued" in data
          ? Number((data as { queued: unknown }).queued)
          : 0;

      toast({
        title: "Announcement sent",
        description:
          queued > 0
            ? `Notified ${queued} member${queued !== 1 ? "s" : ""}.`
            : "No other members to notify.",
      });
      handleOpen(false);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => handleOpen(true)}>
        <Megaphone className="h-4 w-4 mr-1.5" />
        Announce
      </Button>

      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Announcement</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {recipientCount > 0
                ? `Notifies all ${recipientCount} active member${recipientCount !== 1 ? "s" : ""} in-app.`
                : "No other members to notify yet."}
            </p>
          </DialogHeader>

          <div className="space-y-3 py-1">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, CHAR_LIMIT))}
                rows={4}
                disabled={loading}
                placeholder="Write your announcement…"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground text-right">
                {message.length}/{CHAR_LIMIT}
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => handleOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={loading || !message.trim() || recipientCount === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Sending…
                </>
              ) : (
                `Send to ${recipientCount} Member${recipientCount !== 1 ? "s" : ""}`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
