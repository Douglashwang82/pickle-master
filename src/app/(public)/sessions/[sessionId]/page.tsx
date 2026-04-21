import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ArrowLeft, Calendar, MapPin, Users } from "lucide-react";
import RosterList from "@/components/sessions/RosterList";
import JoinButton from "@/components/sessions/JoinButton";
import CancelSessionButton from "@/components/sessions/CancelSessionButton";
import ReviewSection from "@/components/reviews/ReviewSection";
import DebtProgressBar from "@/components/sessions/DebtProgressBar";
import { getWaitlistPosition } from "@/lib/waitlist";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ sessionId: string }> };

type SessionClub = {
  id: string;
  slug: string;
  name: string;
  owner_user_id: string;
};

type PublicSession = {
  id: string;
  title: string;
  status: string;
  capacity: number;
  fee_twd: number;
  scheduled_start_at: string;
  scheduled_end_at: string;
  location_name: string;
  notes: string | null;
  clubs: unknown;
};

export default async function SessionDetailPage({ params }: Params) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: session } = await supabaseAdmin
    .from("sessions")
    .select("*, clubs(id, slug, name, owner_user_id)")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) notFound();

  const sessionDetails = session as unknown as PublicSession;
  const club = sessionDetails.clubs as unknown as SessionClub | null;
  if (!club) notFound();

  const isAuthenticated = !!user;

  // Resolve app-level user
  let appUserId: string | null = null;
  if (user) {
    const { data: appUser } = await supabaseAdmin
      .from("users").select("id").eq("auth_provider_user_id", user.id).single();
    if (appUser) appUserId = appUser.id;
  }

  // Membership check (only for authenticated users)
  let membership: { role: string; status: string } | null = null;
  let isMember = false;
  let isLeader = false;

  if (appUserId) {
    const { data: mem } = await supabaseAdmin
      .from("club_memberships").select("role, status")
      .eq("club_id", club.id).eq("user_id", appUserId).single();
    membership = mem;
    isMember = membership?.status === "active" || club.owner_user_id === appUserId;
    isLeader = (membership?.role === "leader" && membership?.status === "active") || club.owner_user_id === appUserId;
  }

  // Count confirmed registrations
  const { count } = await supabaseAdmin
    .from("session_registrations")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("status", "confirmed");

  const confirmedCount = count ?? 0;
  const availableSpots = sessionDetails.capacity - confirmedCount;

  // Check if current user is already registered
  let myReg: { id: string; status: string } | null = null;
  let waitlistPosition: number | null = null;
  if (appUserId) {
    const { data } = await supabaseAdmin
      .from("session_registrations")
      .select("id, status")
      .eq("session_id", sessionId)
      .eq("user_id", appUserId)
      .in("status", ["confirmed", "payment_pending"])
      .single();
    myReg = data;

    if (!myReg) {
      waitlistPosition = await getWaitlistPosition(sessionId, appUserId);
    }
  }

  // Fetch payment stats for leaders
  let debtStats: { paidCount: number; totalCount: number; totalAmountTwd: number; paidAmountTwd: number } | null = null;
  if (isLeader && sessionDetails.fee_twd > 0) {
    const { data: payments } = await supabaseAdmin
      .from("payment_transactions")
      .select("status, amount_twd")
      .eq("session_id", sessionId)
      .in("status", ["initiated", "succeeded"]);

    if (payments && payments.length > 0) {
      const paid = payments.filter((p) => p.status === "succeeded");
      debtStats = {
        totalCount: payments.length,
        paidCount: paid.length,
        totalAmountTwd: payments.reduce((s, p) => s + p.amount_twd, 0),
        paidAmountTwd: paid.reduce((s, p) => s + p.amount_twd, 0),
      };
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back to club link */}
      <Link
        href={`/clubs/${club.slug}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        {club.name}
      </Link>

      <section className="rounded-[2.2rem] border border-border/70 bg-card/90 p-6 shadow-[0_30px_100px_-62px_rgba(16,42,31,0.5)] backdrop-blur-sm md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center rounded-full bg-accent px-4 py-1.5 text-[0.7rem] font-black uppercase tracking-[0.22em] text-accent-foreground shadow-sm">
              場次詳情
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">{sessionDetails.title}</h1>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary/70">{club.name}</p>
            </div>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div className="flex items-start gap-3 rounded-2xl bg-background/80 px-4 py-4 text-muted-foreground">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  {format(new Date(sessionDetails.scheduled_start_at), "EEEE, MMMM d · h:mm a")}
                  {" – "}
                  {format(new Date(sessionDetails.scheduled_end_at), "h:mm a")}
                </span>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-background/80 px-4 py-4 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{sessionDetails.location_name}</span>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-background/80 px-4 py-4 text-muted-foreground">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  {confirmedCount}/{sessionDetails.capacity} 人已確認
                  {availableSpots > 0 && ` · 剩餘 ${availableSpots} 個名額`}
                </span>
              </div>
              <div className="rounded-2xl bg-primary px-4 py-4 text-primary-foreground">
                <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-primary-foreground/70">費用</p>
                <p className="mt-1 text-lg font-black">{sessionDetails.fee_twd > 0 ? `NT$${sessionDetails.fee_twd}` : "免費加入"}</p>
              </div>
            </div>
          </div>
          <Badge
            variant={
              sessionDetails.status === "cancelled"
                ? "destructive"
                : sessionDetails.status === "full"
                ? "secondary"
                : "default"
            }
            className="w-fit rounded-full capitalize px-4 py-2 text-xs font-black uppercase tracking-[0.16em]"
          >
            {sessionDetails.status}
          </Badge>
        </div>
      </section>

      {sessionDetails.notes && (
        <Card className="rounded-[1.8rem] border-border/70 bg-background/85 shadow-[0_24px_80px_-60px_rgba(16,42,31,0.45)]">
          <CardContent className="p-6">
            <p className="text-sm leading-7 text-muted-foreground whitespace-pre-line">{sessionDetails.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Payment collection progress bar (leader only) */}
      {isLeader && debtStats && (
        <Card className="rounded-[1.8rem] border-border/70 bg-background/85 shadow-[0_24px_80px_-60px_rgba(16,42,31,0.45)]">
          <CardContent className="space-y-5 p-6">
            <div>
              <p className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-primary/70">收款進度</p>
            </div>
          <DebtProgressBar
            paidCount={debtStats.paidCount}
            totalCount={debtStats.totalCount}
            totalAmountTwd={debtStats.totalAmountTwd}
            paidAmountTwd={debtStats.paidAmountTwd}
          />
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {sessionDetails.status !== "cancelled" && (
        <Card className="rounded-[1.8rem] border-border/70 bg-background/85 shadow-[0_24px_80px_-60px_rgba(16,42,31,0.45)]">
          <CardContent className="flex flex-wrap gap-3 p-6">
          {/* Guest: show login-to-join button */}
          {!isAuthenticated && sessionDetails.status !== "auto_closed" && sessionDetails.status !== "completed" && (
            <JoinButton
              sessionId={sessionId}
              fee={sessionDetails.fee_twd}
              isFull={availableSpots <= 0}
              isAuthenticated={false}
            />
          )}

          {/* Authenticated non-member: prompt to join the club first */}
          {isAuthenticated && !isMember && sessionDetails.status !== "auto_closed" && sessionDetails.status !== "completed" && (
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">您需要先成為社團成員才能報名場次。</p>
              <Button asChild variant="outline">
                <Link href={`/clubs/${club.slug}?tab=info`}>加入社團</Link>
              </Button>
            </div>
          )}

          {/* Member: show normal join/registered state */}
          {isMember && !myReg && sessionDetails.status !== "auto_closed" && sessionDetails.status !== "completed" && (
            <JoinButton
              sessionId={sessionId}
              fee={sessionDetails.fee_twd}
              isFull={availableSpots <= 0}
              isAuthenticated={true}
              waitlistPosition={waitlistPosition}
            />
          )}
          {!myReg && waitlistPosition && (
            <Badge variant="outline">候補順位 #{waitlistPosition}</Badge>
          )}
          {myReg && (
            <Badge variant="secondary">
              {myReg.status === "confirmed" ? "您已報名" : "付款待確認"}
            </Badge>
          )}
          {isLeader && (sessionDetails.status === "published" || sessionDetails.status === "full") && (
            <CancelSessionButton sessionId={sessionId} />
          )}
          </CardContent>
        </Card>
      )}

      {/* Roster — visible to members only */}
      {isMember ? (
        <Card className="rounded-[1.8rem] border-border/70 bg-background/85 shadow-[0_24px_80px_-60px_rgba(16,42,31,0.45)]">
          <CardContent className="p-6">
          <RosterList sessionId={sessionId} isLeader={isLeader} />
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-[1.8rem] border-border/70 bg-background/85 shadow-[0_24px_80px_-60px_rgba(16,42,31,0.45)]">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            成為社團成員後即可查看報名名單。
          </CardContent>
        </Card>
      )}

      {(sessionDetails.status === "completed" || sessionDetails.status === "auto_closed") && isMember && !isLeader && (
        <Card className="rounded-[1.8rem] border-border/70 bg-background/85 shadow-[0_24px_80px_-60px_rgba(16,42,31,0.45)]">
          <CardContent className="p-6">
          <ReviewSection
            sessionId={sessionId}
            venueId={null}
            venueName={null}
          />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
