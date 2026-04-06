"use client";

import { useState } from "react";
import VenueReviewModal from "@/components/reviews/VenueReviewModal";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  venueId: string;
  venueName: string;
  sessionId: string;
};

export default function VenueRatingClient({ venueId, venueName, sessionId }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2 shrink-0">
        <Star className="w-4 h-4 fill-current" />
        Rate Venue
      </Button>

      <VenueReviewModal
        venueId={venueId}
        venueName={venueName}
        sessionId={sessionId}
        open={open}
        onOpenChange={setOpen}
        onSubmitted={() => {
          router.refresh();
        }}
      />
    </>
  );
}
