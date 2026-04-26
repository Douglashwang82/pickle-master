"use client";

import dynamic from "next/dynamic";
import type { PublicSession } from "@/types/domain";

const SessionMapView = dynamic(() => import("@/components/sessions/SessionMapView"), {
  ssr: false,
  loading: () => <div className="h-[520px] animate-pulse rounded-2xl bg-secondary" />,
});

type Props = {
  sessions: PublicSession[];
};

export default function SessionMapLoader({ sessions }: Props) {
  return <SessionMapView sessions={sessions} />;
}
