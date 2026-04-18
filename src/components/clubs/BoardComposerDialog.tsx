"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Megaphone, NotebookPen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { BoardPostImportance, BoardPostKind } from "@/types/domain";

type Props = {
  clubId: string;
  isLeader: boolean;
};

const BODY_LIMIT = 1000;

export default function BoardComposerDialog({ clubId, isLeader }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<BoardPostKind>("announcement");
  const [importance, setImportance] = useState<BoardPostImportance>("normal");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetState() {
    setKind("announcement");
    setImportance("normal");
    setTitle("");
    setBody("");
    setIsPinned(false);
    setError(null);
  }

  function handleOpen(next: boolean) {
    setOpen(next);
    if (!next) {
      resetState();
    }
  }

  async function handleSubmit() {
    if (!body.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/clubs/${clubId}/board`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          importance,
          title,
          body,
          is_pinned: isLeader ? isPinned : false,
        }),
      });

      const data: unknown = await response.json();
      if (!response.ok) {
        const nextError =
          data && typeof data === "object" && "error" in data
            ? String((data as { error: unknown }).error)
            : "Unable to save board post";
        setError(nextError);
        return;
      }

      const queuedNotifications =
        data && typeof data === "object" && "queuedNotifications" in data
          ? Number((data as { queuedNotifications: unknown }).queuedNotifications)
          : 0;

      toast({
        title: isLeader ? "Post published" : "Submitted for review",
        description: isLeader
          ? queuedNotifications > 0
            ? `Notified ${queuedNotifications} members.`
            : "The board has been updated."
          : "A leader can publish it after review.",
      });

      handleOpen(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const submitLabel = isLeader ? "Publish to Board" : "Submit for Review";
  const Icon = kind === "announcement" ? Megaphone : NotebookPen;

  return (
    <>
      <Button onClick={() => handleOpen(true)}>
        <Icon className="mr-2 h-4 w-4" />
        {isLeader ? "Create board post" : "Submit a post"}
      </Button>

      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isLeader ? "Create a club board post" : "Submit a club board post"}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {isLeader
                ? "Important announcements notify members immediately after publishing."
                : "Members can submit announcements or notes for leader approval."}
            </p>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Post type</label>
                <Select value={kind} onValueChange={(value) => setKind(value as BoardPostKind)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a post type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Importance</label>
                <Select
                  value={importance}
                  onValueChange={(value) => setImportance(value as BoardPostImportance)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose importance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value.slice(0, 120))}
                placeholder="Add a short title"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value.slice(0, BODY_LIMIT))}
                rows={6}
                disabled={loading}
                placeholder="Share an announcement, important note, or update for the club."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              />
              <p className="text-right text-xs text-muted-foreground">{body.length}/{BODY_LIMIT}</p>
            </div>

            {isLeader && (
              <label className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(event) => setIsPinned(event.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <span>Pin this post to the top of the board</span>
              </label>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => handleOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !body.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}