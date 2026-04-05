import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/db";
import { Button } from "@/components/ui/button";
import SessionCard from "@/components/sessions/SessionCard";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export default async function SessionsPage({ params }: Params) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: club } = await supabaseAdmin
    .from("clubs").select("id, name, slug").eq("slug", slug).single();
  if (!club) notFound();

  const { data: appUser } = await supabaseAdmin
    .from("users").select("id").eq("auth_provider_user_id", user.id).single();
  if (!appUser) redirect("/login");

  const { data: membership } = await supabaseAdmin
    .from("club_memberships").select("role, status")
    .eq("club_id", club.id).eq("user_id", appUser.id).single();
  if (membership?.status !== "active") redirect(`/clubs/${slug}`);

  const isLeader = membership.role === "leader";

  const { data: sessions } = await supabaseAdmin
    .from("sessions")
    .select("*")
    .eq("club_id", club.id)
    .in("status", ["published", "full"])
    .gte("scheduled_start_at", new Date().toISOString())
    .order("scheduled_start_at", { ascending: true });

  // Count confirmed registrations per session
  const sessionIds = (sessions ?? []).map((s) => s.id);
  const { data: regCounts } = sessionIds.length
    ? await supabaseAdmin
        .from("session_registrations")
        .select("session_id")
        .in("session_id", sessionIds)
        .eq("status", "confirmed")
    : { data: [] };

  const countMap: Record<string, number> = {};
  for (const r of regCounts ?? []) {
    countMap[r.session_id] = (countMap[r.session_id] ?? 0) + 1;
  }

  const sessionsWithSpots = (sessions ?? []).map((s) => ({
    ...s,
    confirmed_count: countMap[s.id] ?? 0,
    available_spots: s.capacity - (countMap[s.id] ?? 0),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sessions</h1>
          <p className="text-muted-foreground text-sm mt-1">{club.name}</p>
        </div>
        {isLeader && (
          <Button asChild>
            <Link href={`/clubs/${slug}/sessions/new`}>
              <Plus className="h-4 w-4 mr-1" />
              New Session
            </Link>
          </Button>
        )}
      </div>

      {sessionsWithSpots.length > 0 ? (
        <div className="space-y-3">
          {sessionsWithSpots.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p>No upcoming sessions.</p>
          {isLeader && (
            <Button variant="link" asChild>
              <Link href={`/clubs/${slug}/sessions/new`}>Create one</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
