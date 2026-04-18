"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link2, Copy, RefreshCw, Trash2, CheckCheck } from "lucide-react";

type InviteLink = {
  id: string;
  token: string;
  use_count: number;
  created_at: string;
  expires_at: string | null;
};

type Props = {
  clubId: string;
};

export default function InviteLinkManager({ clubId }: Props) {
  const [link, setLink] = useState<InviteLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appUrl =
    typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL ?? "");

  const fetchLink = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/clubs/${clubId}/invite`);
      if (res.ok) {
        const data: InviteLink | null = await res.json();
        setLink(data);
      }
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    fetchLink();
  }, [fetchLink]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/clubs/${clubId}/invite`, { method: "POST" });
      const data: unknown = await res.json();
      if (!res.ok) {
        const err = data as { error?: string };
        setError(err.error ?? "Failed to generate link");
        return;
      }
      setLink(data as InviteLink);
    } finally {
      setGenerating(false);
    }
  }

  async function handleRevoke() {
    setRevoking(true);
    setError(null);
    try {
      const res = await fetch(`/api/clubs/${clubId}/invite`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Failed to revoke link");
        return;
      }
      setLink(null);
    } finally {
      setRevoking(false);
    }
  }

  async function handleCopy() {
    if (!link) return;
    const url = `${appUrl}/invite/${link.token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inviteUrl = link ? `${appUrl}/invite/${link.token}` : "";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold">邀請連結</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        產生邀請連結，讓任何人可透過連結加入或申請加入本社團。
      </p>

      <Separator />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : link ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              readOnly
              value={inviteUrl}
              className="font-mono text-xs"
              onFocus={(e) => e.target.select()}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              title="Copy link"
            >
              {copied ? (
                <CheckCheck className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                已使用 {link.use_count} 次
              </Badge>
              {link.expires_at && (
                <span>到期：{new Date(link.expires_at).toLocaleDateString()}</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={generating}
                title="Regenerate (invalidates old link)"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${generating ? "animate-spin" : ""}`} />
                重新產生
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRevoke}
                disabled={revoking}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                撤銷
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? "產生中…" : "產生邀請連結"}
        </Button>
      )}
    </div>
  );
}
