import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, Clock, DollarSign, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SessionWithSpots } from "@/types/domain";

type Props = {
  session: SessionWithSpots;
};

export default function SessionCard({ session }: Props) {
  const isFull = session.available_spots <= 0;
  const isFewSpots = !isFull && session.available_spots <= Math.max(2, Math.ceil(session.capacity * 0.2));
  const confirmedPercent = Math.min(100, Math.max(0, (session.confirmed_count / session.capacity) * 100));
  const statusLabel = isFull ? "Full" : isFewSpots ? "Few spots" : "Open";
  const statusVariant: "destructive" | "outline" | "secondary" = isFull
    ? "destructive"
    : isFewSpots
    ? "outline"
    : "secondary";

  return (
    <Link href={`/sessions/${session.id}`} className="block">
      <Card className="group overflow-hidden rounded-lg border-border/80 shadow-sm transition-colors hover:border-primary/45 hover:bg-accent/20">
        {session.image_url && (
          <div className="aspect-[16/7] w-full overflow-hidden bg-muted">
            <img
              src={session.image_url}
              alt={session.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
        )}

        <CardHeader className="space-y-3 p-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h3 className="line-clamp-2 text-base font-semibold leading-tight text-foreground">
                {session.title}
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {format(new Date(session.scheduled_start_at), "EEE, MMM d")}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {format(new Date(session.scheduled_start_at), "h:mm a")}
                </span>
              </div>
            </div>
            <Badge variant={statusVariant} className="shrink-0">
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 p-4 pt-0 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{session.location_name}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border bg-background/80 px-3 py-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                Capacity
              </div>
              <p className="mt-1 font-semibold text-foreground">
                {session.confirmed_count}/{session.capacity}
              </p>
            </div>
            <div className="rounded-md border bg-background/80 px-3 py-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5" />
                Fee
              </div>
              <p className="mt-1 font-semibold text-foreground">
                {session.fee_twd > 0 ? `NT$${session.fee_twd}` : "Free"}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", isFull ? "bg-destructive" : "bg-primary")}
                style={{ width: `${confirmedPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>{session.available_spots} spots left</span>
              <span className="font-medium text-foreground">View details</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
