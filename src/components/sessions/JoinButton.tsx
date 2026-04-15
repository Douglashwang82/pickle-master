"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import PaymentModal from "@/components/payments/PaymentModal";

type Props = {
  sessionId: string;
  fee: number;
  isFull: boolean;
  isAuthenticated?: boolean;
};

export default function JoinButton({ sessionId, fee, isFull, isAuthenticated = true }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleSuccess() {
    window.dispatchEvent(new CustomEvent('rosterRefresh'));
    router.refresh();
  }

  if (isFull) {
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
