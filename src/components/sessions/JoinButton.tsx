"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import PaymentModal from "@/components/payments/PaymentModal";
import { useToast } from "@/hooks/use-toast";

type Props = {
  sessionId: string;
  fee: number;
  isFull: boolean;
  isAuthenticated?: boolean;
  waitlistPosition?: number | null;
};

export default function JoinButton({
  sessionId,
  fee,
  isFull,
  isAuthenticated = true,
  waitlistPosition = null,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const { toast } = useToast();

  function handleSuccess() {
    window.dispatchEvent(new CustomEvent('rosterRefresh'));
    router.refresh();
  }

  async function handleWaitlistJoin() {
    setPending(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Failed to join waitlist";
        toast({ title: "無法加入候補", description: message, variant: "destructive" });
        return;
      }

      const position =
        typeof data === "object" &&
        data !== null &&
        "position" in data &&
        typeof data.position === "number"
          ? data.position
          : null;

      toast({
        title: "已加入候補",
        description: position ? `您目前排在第 ${position} 位。` : "有名額釋出時，我們會通知您。",
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleWaitlistLeave() {
    setPending(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/waitlist`, { method: "DELETE" });
      const data: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Failed to leave waitlist";
        toast({ title: "無法退出候補", description: message, variant: "destructive" });
        return;
      }

      toast({ title: "已退出候補" });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (isFull) {
    if (isAuthenticated && waitlistPosition) {
      return (
        <Button variant="outline" onClick={handleWaitlistLeave} disabled={pending}>
          {pending ? "處理中..." : `候補中 #${waitlistPosition} · 退出候補`}
        </Button>
      );
    }

    if (isAuthenticated) {
      return (
        <Button onClick={handleWaitlistJoin} disabled={pending}>
          {pending ? "處理中..." : "加入候補"}
        </Button>
      );
    }

    return (
      <Button disabled variant="secondary">
        名額已滿
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button onClick={() => router.push(`/login?next=/sessions/${sessionId}`)}>
        {fee > 0 ? `登入以加入 · NT$${fee}` : "登入以加入"}
      </Button>
    );
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        {fee > 0 ? `加入 · NT$${fee}` : "免費加入"}
      </Button>
      <PaymentModal
        sessionId={sessionId}
        fee={fee}
        open={open}
        onOpenChange={setOpen}
        onSuccess={handleSuccess}
      />
    </>
  );
}
