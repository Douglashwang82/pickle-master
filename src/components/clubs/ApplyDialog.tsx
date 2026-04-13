"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Application = { id: string; status: string } | null;

type Props = {
  clubId: string;
  clubSlug: string;
  currentApplication: Application;
};

export default function ApplyDialog({ clubId, clubSlug, currentApplication }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [introMessage, setIntroMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/clubs/${clubId}/applications`, {
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

    setSubmitted(true);
    setLoading(false);
    router.refresh();
  }

  async function handleCancel() {
    if (!currentApplication) return;
    if (!confirm("Cancel your application?")) return;
    setCancelLoading(true);
    await fetch(`/api/clubs/${clubId}/applications/${currentApplication.id}`, { method: "DELETE" });
    router.refresh();
    setCancelLoading(false);
  }

  // Show cancel / pending state inline (no dialog needed)
  if (currentApplication?.status === "pending") {
    return (
      <div className="flex items-center gap-2">
        <Button variant="secondary" disabled>Application Pending</Button>
        <Button variant="outline" onClick={handleCancel} disabled={cancelLoading}>
          {cancelLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Withdraw
        </Button>
      </div>
    );
  }

  if (currentApplication?.status === "rejected") {
    return (
      <div className="space-y-1">
        <Button variant="destructive" disabled>Application Rejected</Button>
        <p className="text-xs text-muted-foreground">You can&apos;t apply again at this time.</p>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setSubmitted(false); setError(null); } }}>
      <DialogTrigger asChild>
        <Button>Apply to Join</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply to Join</DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-4 py-2">
            <Alert>
              <AlertDescription>
                Application submitted! The club leader will review it and get back to you.
              </AlertDescription>
            </Alert>
            <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1">
              <Label htmlFor="intro">Tell the leader about yourself (optional)</Label>
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
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
