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
    if (!confirm("Are you sure you want to cancel your application?")) return;
    setLoading(true);
    await fetch(`/api/clubs/${clubId}/applications/${application.id}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  if (!application) {
    return (
      <Button asChild>
        <Link href={`/clubs/${clubSlug}/apply`}>Apply to Join</Link>
      </Button>
    );
  }

  if (application.status === "pending") {
    return (
      <div className="flex items-center gap-2">
        <Button variant="secondary" disabled>Pending</Button>
        <Button variant="outline" onClick={handleCancel} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Cancel Request
        </Button>
      </div>
    );
  }

  if (application.status === "rejected") {
    return (
      <div className="flex flex-col gap-2">
        <Button variant="destructive" disabled>Rejected</Button>
        <p className="text-xs text-muted-foreground">You can't apply again at this time.</p>
      </div>
    );
  }

  return null;
}
