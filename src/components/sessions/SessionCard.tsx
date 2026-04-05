import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { MapPin, Users, DollarSign } from "lucide-react";
import type { SessionWithSpots } from "@/types/domain";

type Props = {
  session: SessionWithSpots;
};

export default function SessionCard({ session }: Props) {
  const isFull = session.available_spots <= 0;

  return (
    <Link href={`/sessions/${session.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">{session.title}</h3>
            <Badge variant={isFull ? "destructive" : "secondary"}>
              {isFull ? "Full" : `${session.available_spots} spots`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">
            {format(new Date(session.scheduled_start_at), "EEE, MMM d · h:mm a")}
          </p>
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {session.location_name}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {session.confirmed_count}/{session.capacity}
            </div>
            {session.fee_twd > 0 && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                NT${session.fee_twd}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
