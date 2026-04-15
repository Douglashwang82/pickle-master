"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, MapPin } from "lucide-react";
import PeerReviewModal from "./PeerReviewModal";
import VenueReviewModal from "./VenueReviewModal";

type Player = {
  user_id: string;
  display_name: string;
  photo_url: string | null;
  already_reviewed: boolean;
};

type Props = {
  sessionId: string;
  venueId?: string | null;
  venueName?: string | null;
};

export default function ReviewSection({ sessionId, venueId, venueName }: Props) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [hasReviewedAll, setHasReviewedAll] = useState(false);
  const [hasReviewedVenue, setHasReviewedVenue] = useState(false);
  const [peerModalOpen, setPeerModalOpen] = useState(false);
  const [venueModalOpen, setVenueModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/sessions/${sessionId}/reviewable-players`);
      if (res.ok) {
        const data = await res.json();
        setPlayers(data.players ?? []);
        setHasReviewedAll(data.has_reviewed_all ?? false);
      }
      setLoading(false);
    }
    load();
  }, [sessionId]);

  if (loading) return null;

  const unreviewedPlayers = players.filter((p) => !p.already_reviewed);
  const showPeerSection = players.length > 0;
  const showVenueSection = !!venueId && !!venueName;

  if (!showPeerSection && !showVenueSection) return null;

  return (
    <div className="space-y-3">
      {showPeerSection && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              評分球友
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasReviewedAll ? (
              <p className="text-sm text-muted-foreground">
                您已完成此場次所有球員的評分。
              </p>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  尚有 {unreviewedPlayers.length} 位球員待評分
                </p>
                <Button size="sm" onClick={() => setPeerModalOpen(true)}>
                  評分球友
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showVenueSection && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              評分場地
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasReviewedVenue ? (
              <p className="text-sm text-muted-foreground">
                您已完成此場次的場地評分。
              </p>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{venueName}</p>
                <Button size="sm" variant="outline" onClick={() => setVenueModalOpen(true)}>
                  評分場地
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {peerModalOpen && (
        <PeerReviewModal
          sessionId={sessionId}
          players={unreviewedPlayers}
          open={peerModalOpen}
          onOpenChange={setPeerModalOpen}
          onSubmitted={() => setHasReviewedAll(true)}
        />
      )}

      {venueModalOpen && venueId && venueName && (
        <VenueReviewModal
          venueId={venueId}
          venueName={venueName}
          sessionId={sessionId}
          open={venueModalOpen}
          onOpenChange={setVenueModalOpen}
          onSubmitted={() => setHasReviewedVenue(true)}
        />
      )}
    </div>
  );
}
