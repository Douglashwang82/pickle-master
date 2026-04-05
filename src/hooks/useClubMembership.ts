"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MemberRole, MembershipStatus } from "@/types/domain";

type MembershipInfo = {
  role: MemberRole | null;
  status: MembershipStatus | null;
  loading: boolean;
};

/**
 * Returns the current authenticated user's membership in the given club.
 * Requires the club UUID (not slug).
 */
export function useClubMembership(clubId: string): MembershipInfo {
  const supabase = createClient();
  const [info, setInfo] = useState<MembershipInfo>({ role: null, status: null, loading: true });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setInfo({ role: null, status: null, loading: false });
        return;
      }

      const { data } = await supabase
        .from("club_memberships")
        .select("role, status")
        .eq("club_id", clubId)
        .eq("user_id", user.id)
        .single();

      const row = data as { role: string; status: string } | null;
      setInfo({
        role: (row?.role as MemberRole) ?? null,
        status: (row?.status as MembershipStatus) ?? null,
        loading: false,
      });
    }

    load();
  }, [clubId]);

  return info;
}
