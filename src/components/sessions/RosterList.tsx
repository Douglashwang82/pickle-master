"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { RegistrationWithPayment } from "@/types/domain";

type Props = {
  sessionId: string;
  isLeader?: boolean;
};

export default function RosterList({ sessionId, isLeader }: Props) {
  const [roster, setRoster] = useState<RegistrationWithPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function fetchRoster() {
      const res = await fetch(`/api/sessions/${sessionId}/roster`);
      if (res.ok) {
        const data = await res.json();
        setRoster(data);
      }
      setLoading(false);
    }

    fetchRoster();

    // Realtime subscription
    const channel = supabase
      .channel(`roster:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "session_registrations",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchRoster();
        }
      )
      .subscribe();

    // Manual local override
    const handleLocalRefresh = () => fetchRoster();
    window.addEventListener("rosterRefresh", handleLocalRefresh);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("rosterRefresh", handleLocalRefresh);
    };
  }, [sessionId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    );
  }

  const confirmed = roster.filter((r) => r.status === "confirmed");
  const pending = roster.filter((r) => r.status === "payment_pending");

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">
        Roster ({confirmed.length} confirmed{pending.length > 0 ? `, ${pending.length} pending` : ""})
      </h3>

      {confirmed.length === 0 && (
        <p className="text-sm text-muted-foreground">No confirmed participants yet.</p>
      )}

      <div className="space-y-2">
        {confirmed.map((reg) => (
          <RosterRow
            key={reg.id}
            reg={reg}
            isLeader={isLeader}
            sessionId={sessionId}
            onAction={() => {
              fetch(`/api/sessions/${sessionId}/roster`)
                .then((r) => r.json())
                .then(setRoster);
              router.refresh();
            }}
          />
        ))}
        {isLeader &&
          pending.map((reg) => (
            <RosterRow
              key={reg.id}
              reg={reg}
              isLeader={isLeader}
              sessionId={sessionId}
              isPending
              onAction={() => {
                fetch(`/api/sessions/${sessionId}/roster`)
                  .then((r) => r.json())
                  .then(setRoster);
                router.refresh();
              }}
            />
          ))}
      </div>
    </div>
  );
}

function PaymentBadge({ payment }: { payment: RegistrationWithPayment["payment"] }) {
  if (!payment) return null;

  if (payment.status === "succeeded") {
    return (
      <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-600">
        Paid
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-xs text-amber-600 border-amber-400">
      Unpaid · NT${payment.amount_twd}
    </Badge>
  );
}

function RosterRow({
  reg,
  isLeader,
  sessionId,
  isPending,
  onAction,
}: {
  reg: RegistrationWithPayment;
  isLeader?: boolean;
  sessionId: string;
  isPending?: boolean;
  onAction: () => void;
}) {
  const [removing, setRemoving] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const profile = reg.profile;
  const isUnpaid = reg.payment?.status === "initiated";

  async function handleRemove() {
    if (!confirm("Remove this participant and issue a refund?")) return;
    setRemoving(true);
    await fetch(`/api/sessions/${sessionId}/remove-participant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: profile.user_id }),
    });
    setRemoving(false);
    onAction();
  }

  async function handleNotify() {
    setNotifying(true);
    await fetch(`/api/sessions/${sessionId}/notify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: profile.user_id }),
    });
    setNotifying(false);
    onAction();
  }

  async function handleMarkPaid() {
    setMarkingPaid(true);
    await fetch(`/api/sessions/${sessionId}/mark-debt-paid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: profile.user_id }),
    });
    setMarkingPaid(false);
    onAction();
  }

  return (
    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
      <Avatar className="h-8 w-8">
        <AvatarImage src={profile.photo_url ?? undefined} />
        <AvatarFallback className="text-xs">{profile.display_name?.[0] ?? "?"}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{profile.display_name}</p>
        {profile.skill_level && (
          <p className="text-xs text-muted-foreground capitalize">{profile.skill_level}</p>
        )}
      </div>

      {isPending && <Badge variant="outline" className="text-xs">Pending</Badge>}

      {!isPending && <PaymentBadge payment={reg.payment} />}

      {isLeader && !isPending && (
        <div className="flex items-center gap-1 ml-1">
          {isUnpaid && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={handleNotify}
                disabled={notifying}
              >
                {notifying ? "Sending…" : "Notify"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={handleMarkPaid}
                disabled={markingPaid}
              >
                {markingPaid ? "Saving…" : "Mark Paid"}
              </Button>
            </>
          )}
          <button
            onClick={handleRemove}
            disabled={removing}
            className="text-xs text-destructive hover:underline ml-1"
          >
            {removing ? "Removing…" : "Remove"}
          </button>
        </div>
      )}
    </div>
  );
}
