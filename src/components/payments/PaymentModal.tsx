"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

type Props = {
  sessionId: string;
  fee: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export default function PaymentModal({ sessionId, fee, open, onOpenChange, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Dev-only: simulate failure via env var
  const simulateFailure = process.env.NEXT_PUBLIC_MOCK_PAYMENT_FAIL === "true";

  async function handlePay() {
    setLoading(true);
    setError(null);
    setProgress(30);

    const res = await fetch(`/api/sessions/${sessionId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ simulateFailure }),
    });

    setProgress(90);
    const data = await res.json();
    setProgress(100);

    if (!res.ok) {
      setError(data.error ?? "Payment failed");
      setLoading(false);
      setProgress(0);
      return;
    }

    setLoading(false);
    onOpenChange(false);
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Registration</DialogTitle>
          <DialogDescription>
            {fee > 0
              ? `You will be charged NT$${fee} to join this session.`
              : "This session is free to join."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && <Progress value={progress} className="h-1" />}

        {simulateFailure && (
          <Alert>
            <AlertDescription className="text-xs">
              Dev mode: payment failure simulation is ON (NEXT_PUBLIC_MOCK_PAYMENT_FAIL=true)
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handlePay} disabled={loading}>
            {loading ? "Processing…" : fee > 0 ? `Pay NT$${fee}` : "Join for free"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
