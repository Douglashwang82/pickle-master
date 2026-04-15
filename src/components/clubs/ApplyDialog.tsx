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
  isAuthenticated?: boolean;
};

export default function ApplyDialog({ clubId, clubSlug, currentApplication, isAuthenticated = true }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [introMessage, setIntroMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Guest: redirect to login
  if (!isAuthenticated) {
    return (
      <Button onClick={() => router.push(`/login?next=/clubs/${clubSlug}`)}>
        登入以申請加入
      </Button>
    );
  }

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
      setError(data.error ?? "申請提交失敗");
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
    router.refresh();
  }

  async function handleCancel() {
    if (!currentApplication) return;
    if (!confirm("確定撤回申請？")) return;
    setCancelLoading(true);
    await fetch(`/api/clubs/${clubId}/applications/${currentApplication.id}`, { method: "DELETE" });
    router.refresh();
    setCancelLoading(false);
  }

  // Show cancel / pending state inline (no dialog needed)
  if (currentApplication?.status === "pending") {
    return (
      <div className="flex items-center gap-2">
        <Button variant="secondary" disabled>申請審核中</Button>
        <Button variant="outline" onClick={handleCancel} disabled={cancelLoading}>
          {cancelLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          撤回申請
        </Button>
      </div>
    );
  }

  if (currentApplication?.status === "rejected") {
    return (
      <div className="space-y-1">
        <Button variant="destructive" disabled>申請已拒絕</Button>
        <p className="text-xs text-muted-foreground">目前您無法再次申請。</p>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setSubmitted(false); setError(null); } }}>
      <DialogTrigger asChild>
        <Button>申請加入</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>申請加入</DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-4 py-2">
            <Alert>
              <AlertDescription>
                申請已送出！社團會長將審核您的申請並回覆您。
              </AlertDescription>
            </Alert>
            <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
              關閉
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
              <Label htmlFor="intro">向會長介紹您自己（選填）</Label>
              <textarea
                id="intro"
                value={introMessage}
                onChange={(e) => setIntroMessage(e.target.value)}
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
                placeholder="您為什麼想加入？您的技術程度如何？"
                maxLength={500}
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "提交中…" : "提交申請"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
