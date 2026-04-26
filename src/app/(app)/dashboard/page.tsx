import { supabaseAdmin } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar, ChevronRight, Plus, Shield, Users } from "lucide-react";
import { isNextResponse, requireAuth } from "@/lib/utils/auth-guard";

export const dynamic = "force-dynamic";

type MembershipClub = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  public_status: string;
  membership_type: "open" | "application";
  owner_user_id: string;
};

type MembershipRow = {
  id: string;
  role: "leader" | "member";
  joined_at: string;
  clubs: MembershipClub | MembershipClub[] | null;
};

type DashboardClub = MembershipClub & {
  role: "leader" | "member";
  joined_at: string;
  memberCount: number;
  upcomingSessionCount: number;
};

type RegistrationRow = {
  id: string;
  status: string;
  sessions:
    | {
        id: string;
        title: string;
        scheduled_start_at: string;
        location_name: string;
        fee_twd: number;
        status: string;
        clubs:
          | {
              slug: string;
              name: string;
            }
          | {
              slug: string;
              name: string;
            }[]
          | null;
      }
    | {
        id: string;
        title: string;
        scheduled_start_at: string;
        location_name: string;
        fee_twd: number;
        status: string;
        clubs:
          | {
              slug: string;
              name: string;
            }
          | {
              slug: string;
              name: string;
            }[]
          | null;
      }[]
    | null;
};

type DashboardSession = {
  id: string;
  title: string;
  scheduled_start_at: string;
  location_name: string;
  fee_twd: number;
  status: string;
  club: {
    slug: string;
    name: string;
  } | null;
};

function unwrapRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function clubSummary(count: number, noun: string) {
  return count === 1 ? `1 ${noun}` : `${count} ${noun}s`;
}

function roleLabel(role: "leader" | "member") {
  return role === "leader" ? "Leader" : "Member";
}

function membershipLabel(type: "open" | "application") {
  return type === "open" ? "Open club" : "Approval club";
}

function DashboardClubCard({
  club,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  club: DashboardClub;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <Card className="overflow-hidden border-border/50 bg-card/95">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg">{club.name}</CardTitle>
              <Badge variant={club.role === "leader" ? "default" : "secondary"}>
                {roleLabel(club.role)}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{membershipLabel(club.membership_type)}</Badge>
              <Badge variant="outline">{clubSummary(club.memberCount, "member")}</Badge>
              <Badge variant="outline">{clubSummary(club.upcomingSessionCount, "upcoming session")}</Badge>
            </div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-foreground">
            {club.role === "leader" ? <Shield className="h-5 w-5" /> : <Users className="h-5 w-5" />}
          </div>
        </div>

        <CardDescription className="line-clamp-2 min-h-10 text-sm">
          {club.description || "No club description yet."}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-wrap items-center gap-3 pt-0">
        <Button asChild className="rounded-full">
          <Link href={primaryHref}>{primaryLabel}</Link>
        </Button>
        {secondaryHref && secondaryLabel ? (
          <Button asChild variant="outline" className="rounded-full">
            <Link href={secondaryHref}>{secondaryLabel}</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const auth = await requireAuth();
  if (isNextResponse(auth)) redirect("/login");

  const nowIso = new Date().toISOString();

  const [{ data: memberships }, { data: registrations }] = await Promise.all([
    supabaseAdmin
      .from("club_memberships")
      .select(
        `
          id,
          role,
          joined_at,
          clubs(
            id,
            slug,
            name,
            description,
            cover_image_url,
            public_status,
            membership_type,
            owner_user_id
          )
        `
      )
      .eq("user_id", auth.appUserId)
      .eq("status", "active")
      .order("joined_at", { ascending: false }),
    supabaseAdmin
      .from("session_registrations")
      .select(
        `
          id,
          status,
          sessions(
            id,
            title,
            scheduled_start_at,
            location_name,
            fee_twd,
            status,
            clubs(slug, name)
          )
        `
      )
      .eq("user_id", auth.appUserId)
      .eq("status", "confirmed")
      .gte("sessions.scheduled_end_at", nowIso)
      .order("scheduled_start_at", { ascending: true, referencedTable: "sessions" })
      .limit(12),
  ]);

  const membershipRows = (memberships ?? []) as unknown as MembershipRow[];
  const baseClubs = membershipRows
    .map((membership) => {
      const club = unwrapRelation(membership.clubs);
      if (!club) return null;

      return {
        ...club,
        role: membership.role,
        joined_at: membership.joined_at,
      };
    })
    .filter((club): club is Omit<DashboardClub, "memberCount" | "upcomingSessionCount"> => Boolean(club));

  const clubIds = baseClubs.map((club) => club.id);

  const [memberCountResult, sessionCountResult] = await Promise.all([
    clubIds.length
      ? supabaseAdmin
          .from("club_memberships")
          .select("club_id")
          .in("club_id", clubIds)
          .eq("status", "active")
      : Promise.resolve({ data: [] as { club_id: string }[] }),
    clubIds.length
      ? supabaseAdmin
          .from("sessions")
          .select("club_id")
          .in("club_id", clubIds)
          .in("status", ["published", "full"])
          .gte("scheduled_end_at", nowIso)
      : Promise.resolve({ data: [] as { club_id: string }[] }),
  ]);

  const memberCountMap: Record<string, number> = {};
  for (const row of memberCountResult.data ?? []) {
    memberCountMap[row.club_id] = (memberCountMap[row.club_id] ?? 0) + 1;
  }

  const upcomingSessionCountMap: Record<string, number> = {};
  for (const row of sessionCountResult.data ?? []) {
    upcomingSessionCountMap[row.club_id] = (upcomingSessionCountMap[row.club_id] ?? 0) + 1;
  }

  const clubs = baseClubs.map((club) => ({
    ...club,
    memberCount: memberCountMap[club.id] ?? 0,
    upcomingSessionCount: upcomingSessionCountMap[club.id] ?? 0,
  }));

  const createdClubs = clubs.filter((club) => club.role === "leader");
  const joinedClubs = clubs.filter((club) => club.role === "member");

  const upcomingSessions = ((registrations ?? []) as unknown as RegistrationRow[])
    .map((registration) => {
      const session = unwrapRelation(registration.sessions);
      if (!session) return null;

      return {
        id: session.id,
        title: session.title,
        scheduled_start_at: session.scheduled_start_at,
        location_name: session.location_name,
        fee_twd: session.fee_twd,
        status: session.status,
        club: unwrapRelation(session.clubs),
      };
    })
    .filter((session): session is DashboardSession => Boolean(session));

  const stats = [
    {
      label: "Created clubs",
      value: createdClubs.length,
      icon: Shield,
    },
    {
      label: "Joined clubs",
      value: joinedClubs.length,
      icon: Users,
    },
    {
      label: "Upcoming sessions",
      value: upcomingSessions.length,
      icon: Calendar,
    },
  ];

  const primaryLeaderClub = createdClubs[0] ?? null;

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-border/50 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em]">
              Dashboard
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                Your clubs, sessions, and next moves in one place.
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                Keep an eye on the clubs you lead, the communities you joined, and the sessions already on your calendar.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-full">
              <Link href="/clubs/new">
                <Plus className="mr-2 h-4 w-4" />
                Create club
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/clubs">Browse clubs</Link>
            </Button>
            {primaryLeaderClub ? (
              <Button asChild variant="secondary" className="rounded-full">
                <Link href={`/clubs/${primaryLeaderClub.slug}/sessions/new`}>Create session</Link>
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="border-border/50 bg-background/80">
              <CardContent className="flex items-center justify-between p-5">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-3xl font-black tracking-tight">{value}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Created clubs</h2>
                <p className="text-sm text-muted-foreground">Clubs you can manage right now.</p>
              </div>
              <Button asChild variant="ghost" className="rounded-full">
                <Link href="/clubs">
                  View all clubs
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {createdClubs.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {createdClubs.map((club) => (
                  <DashboardClubCard
                    key={club.id}
                    club={club}
                    primaryHref={`/clubs/${club.slug}`}
                    primaryLabel="Open club"
                    secondaryHref={`/clubs/${club.slug}?tab=settings`}
                    secondaryLabel="Settings"
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-border/60 bg-card/70">
                <CardContent className="flex flex-col items-start gap-4 p-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">No created clubs yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Start your first club to publish sessions, review applications, and manage your roster from one place.
                    </p>
                  </div>
                  <Button asChild className="rounded-full">
                    <Link href="/clubs/new">Create your first club</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Joined clubs</h2>
              <p className="text-sm text-muted-foreground">Communities where you are already an active member.</p>
            </div>

            {joinedClubs.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {joinedClubs.map((club) => (
                  <DashboardClubCard
                    key={club.id}
                    club={club}
                    primaryHref={`/clubs/${club.slug}`}
                    primaryLabel="View club"
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-border/60 bg-card/70">
                <CardContent className="flex flex-col items-start gap-4 p-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">No joined clubs yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Browse public clubs to find a community that matches your level and schedule.
                    </p>
                  </div>
                  <Button asChild variant="outline" className="rounded-full">
                    <Link href="/clubs">Explore clubs</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>
        </div>

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Upcoming sessions</h2>
            <p className="text-sm text-muted-foreground">Confirmed sessions you are already booked into.</p>
          </div>

          {upcomingSessions.length > 0 ? (
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <Card key={session.id} className="border-border/50 bg-card/95">
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <CardTitle className="text-lg">{session.title}</CardTitle>
                        {session.club ? (
                          <CardDescription>
                            <Link href={`/clubs/${session.club.slug}`} className="font-medium text-foreground hover:text-primary">
                              {session.club.name}
                            </Link>
                          </CardDescription>
                        ) : (
                          <CardDescription>Club unavailable</CardDescription>
                        )}
                      </div>
                      <Badge variant={session.status === "cancelled" ? "destructive" : "secondary"}>
                        {session.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>{format(new Date(session.scheduled_start_at), "PPP p")}</p>
                      <p>{session.location_name}</p>
                      <p>{session.fee_twd > 0 ? `NT$${session.fee_twd}` : "Free session"}</p>
                    </div>
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href={`/sessions/${session.id}`}>View session</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-border/60 bg-card/70">
              <CardContent className="flex flex-col items-start gap-4 p-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">No upcoming sessions yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Join a club session to start building out your playing calendar.
                  </p>
                </div>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/sessions">Browse sessions</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
