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
            : "公告發送失敗";
        setError(errMsg);
        return;
      }

      const queued =
        data && typeof data === "object" && "queued" in data
          ? Number((data as { queued: unknown }).queued)
          : 0;

      toast({
        title: "公告已發送",
        description:
          queued > 0
            ? `已通知 ${queued} 位成員。`
            : "沒有其他成員需要通知。",
      });
      handleOpen(false);
    } catch {
      setError("發生錯誤，請再試一次。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => handleOpen(true)}>
        <Megaphone className="h-4 w-4 mr-1.5" />
        公告
      </Button>

      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>發送公告</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {recipientCount > 0
                ? `將以站內訊息通知全部 ${recipientCount} 位在籍成員。`
                : "目前沒有其他成員可通知。"}
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
                placeholder="撰寫公告內容…"
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
              取消
            </Button>
            <Button
              onClick={handleSend}
              disabled={loading || !message.trim() || recipientCount === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  發送中…
                </>
              ) : (
                `發送給 ${recipientCount} 位成員`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
