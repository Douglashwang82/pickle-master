"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { RegistrationWithProfile } from "@/types/domain";

type Props = {
  sessionId: string;
  isLeader?: boolean;
};

export default function RosterList({ sessionId, isLeader }: Props) {
  const [roster, setRoster] = useState<RegistrationWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Initial fetch
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
          // Re-fetch on any change — simple and correct
          fetchRoster();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
          <RosterRow key={reg.id} reg={reg} isLeader={isLeader} sessionId={sessionId} />
        ))}
        {isLeader && pending.map((reg) => (
          <RosterRow key={reg.id} reg={reg} isLeader={isLeader} sessionId={sessionId} isPending />
        ))}
      </div>
    </div>
  );
}

function RosterRow({
  reg,
  isLeader,
  sessionId,
  isPending,
}: {
  reg: RegistrationWithProfile;
  isLeader?: boolean;
  sessionId: string;
  isPending?: boolean;
}) {
  const [removing, setRemoving] = useState(false);
  const profile = reg.profile;

  async function handleRemove() {
    if (!confirm("Remove this participant and issue a refund?")) return;
    setRemoving(true);
    await fetch(`/api/sessions/${sessionId}/remove-participant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: profile.user_id }),
    });
    setRemoving(false);
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
      {isLeader && !isPending && (
        <button
          onClick={handleRemove}
          disabled={removing}
          className="text-xs text-destructive hover:underline ml-2"
        >
          {removing ? "Removing…" : "Remove"}
        </button>
      )}
    </div>
  );
}
