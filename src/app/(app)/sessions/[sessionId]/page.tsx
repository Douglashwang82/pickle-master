import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { MapPin, Users, Calendar } from "lucide-react";
import RosterList from "@/components/sessions/RosterList";
import JoinButton from "@/components/sessions/JoinButton";
import CancelSessionButton from "@/components/sessions/CancelSessionButton";
import ReviewSection from "@/components/reviews/ReviewSection";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ sessionId: string }> };

export default async function SessionDetailPage({ params }: Params) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: appUser } = await supabaseAdmin
    .from("users").select("id").eq("auth_provider_user_id", user.id).single();
  if (!appUser) redirect("/login");

  const { data: session } = await supabaseAdmin
    .from("sessions")
    .select("*, clubs(id, slug, name), venues(id, name)")
    .eq("id", sessionId)
    .single();

  if (!session) notFound();

  const club = session.clubs as { id: string; slug: string; name: string } | null;
  const venue = session.venues as { id: string; name: string } | null;
  if (!club) notFound();

  // Membership check
  const { data: membership } = await supabaseAdmin
    .from("club_memberships").select("role, status")
    .eq("club_id", club.id).eq("user_id", appUser.id).single();

  if (membership?.status !== "active") redirect(`/clubs/${club.slug}`);

  const isLeader = membership.role === "leader";

  // Count confirmed
  const { count } = await supabaseAdmin
    .from("session_registrations")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("status", "confirmed");

  const confirmedCount = count ?? 0;
  const availableSpots = session.capacity - confirmedCount;

  // Check if current user is already registered
  const { data: myReg } = await supabaseAdmin
    .from("session_registrations")
    .select("id, status")
    .eq("session_id", sessionId)
    .eq("user_id", appUser.id)
    .in("status", ["confirmed", "payment_pending"])
    .single();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{session.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{club.name}</p>
        </div>
        <Badge
          variant={
            session.status === "cancelled"
              ? "destructive"
              : session.status === "full"
              ? "secondary"
              : "default"
          }
          className="capitalize"
        >
          {session.status}
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {format(new Date(session.scheduled_start_at), "EEEE, MMMM d · h:mm a")}
            {" – "}
            {format(new Date(session.scheduled_end_at), "h:mm a")}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{session.location_name}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            {confirmedCount}/{session.capacity} confirmed
            {availableSpots > 0 && ` · ${availableSpots} spots left`}
          </span>
        </div>
        {session.fee_twd > 0 && (
          <p className="font-semibold text-foreground">NT${session.fee_twd}</p>
        )}
      </div>

      {session.notes && (
        <div>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{session.notes}</p>
        </div>
      )}

      <Separator />

      {/* Actions */}
      {session.status !== "cancelled" && (
        <div className="flex flex-wrap gap-3">
          {!isLeader && !myReg && session.status !== "auto_closed" && session.status !== "completed" && (
            <JoinButton
              sessionId={sessionId}
              fee={session.fee_twd}
              isFull={availableSpots <= 0}
            />
          )}
          {myReg && (
            <Badge variant="secondary">
              {myReg.status === "confirmed" ? "You are registered" : "Payment pending"}
            </Badge>
          )}
          {isLeader && (session.status === "published" || session.status === "full") && (
            <CancelSessionButton sessionId={sessionId} />
          )}
        </div>
      )}

      <Separator />

      <RosterList sessionId={sessionId} isLeader={isLeader} />

      {(session.status === "completed" || session.status === "auto_closed") && !isLeader && (
        <>
          <Separator />
          <ReviewSection
            sessionId={sessionId}
            venueId={venue?.id ?? null}
            venueName={venue?.name ?? null}
          />
        </>
      )}
    </div>
  );
}
