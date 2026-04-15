"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2 } from "lucide-react";

type Application = {
  id: string;
  status: string;
};

type Props = {
  clubId: string;
  clubSlug: string;
  application: Application | null;
};

export default function ApplicationStatusButton({ clubId, clubSlug, application }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    if (!application) return;
    if (!confirm("確定撤回申請？")) return;
    setLoading(true);
    await fetch(`/api/clubs/${clubId}/applications/${application.id}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  if (!application) {
    return (
      <Button asChild>
        <Link href={`/clubs/${clubSlug}/apply`}>申請加入</Link>
      </Button>
    );
  }

  if (application.status === "pending") {
    return (
      <div className="flex items-center gap-2">
        <Button variant="secondary" disabled>申請審核中</Button>
        <Button variant="outline" onClick={handleCancel} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          撤回申請
        </Button>
      </div>
    );
  }

  if (application.status === "rejected") {
    return (
      <div className="flex flex-col gap-2">
        <Button variant="destructive" disabled>申請已拒絕</Button>
        <p className="text-xs text-muted-foreground">目前您無法再次申請。</p>
      </div>
    );
  }

  return null;
}
