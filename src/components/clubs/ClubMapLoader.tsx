"use client";

import dynamic from "next/dynamic";
import type { ClubWithDiscovery } from "@/types/domain";

// dynamic() with ssr:false must live in a Client Component
const ClubMapView = dynamic(
  () => import("@/components/clubs/ClubMapView"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[520px] rounded-2xl bg-secondary animate-pulse" />
    ),
  }
);

type Props = {
  clubs: ClubWithDiscovery[];
  userLat?: number;
  userLng?: number;
};

export default function ClubMapLoader({ clubs, userLat, userLng }: Props) {
  return <ClubMapView clubs={clubs} userLat={userLat} userLng={userLng} />;
}
