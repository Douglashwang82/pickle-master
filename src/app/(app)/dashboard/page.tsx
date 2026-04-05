import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let { data: appUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("auth_provider_user_id", user.id)
    .single();

  if (!appUser) {
    // Sync missing user record
    const { data: newUser } = await supabaseAdmin
      .from("users")
      .insert({
        auth_provider_user_id: user.id,
        email: user.email ?? "",
      })
      .select("id")
      .single();

    if (!newUser) redirect("/login");
    appUser = newUser;

    // Ensure default profile
    await supabaseAdmin.from("profiles").upsert({
      user_id: appUser.id,
      display_name: user.email?.split("@")[0] ?? "Player",
    }, { onConflict: "user_id" });
  }

  // Upcoming confirmed registrations
  const { data: registrations } = await supabaseAdmin
    .from("session_registrations")
    .select(`
      id, status, joined_at,
      sessions(id, title, scheduled_start_at, location_name, fee_twd, status,
        clubs(slug, name))
    `)
    .eq("user_id", appUser.id)
    .eq("status", "confirmed")
    .order("joined_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Sessions</h1>

      {registrations && registrations.length > 0 ? (
        <div className="space-y-3">
          {registrations.map((reg) => {
            const session = reg.sessions as unknown as {
              id: string;
              title: string;
              scheduled_start_at: string;
              location_name: string;
              fee_twd: number;
              status: string;
              clubs: { slug: string; name: string } | null;
            } | null;
            if (!session) return null;

            return (
              <Card key={reg.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{session.title}</CardTitle>
                    <Badge variant={session.status === "cancelled" ? "destructive" : "secondary"}>
                      {session.status}
                    </Badge>
                  </div>
                  {session.clubs && (
                    <p className="text-xs text-muted-foreground">{session.clubs.name}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p>{format(new Date(session.scheduled_start_at), "PPP p")}</p>
                  <p>{session.location_name}</p>
                  {session.fee_twd > 0 && <p>NT${session.fee_twd}</p>}
                  <Button variant="outline" size="sm" asChild className="mt-2">
                    <Link href={`/sessions/${session.id}`}>View session</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p>No upcoming sessions.</p>
          <Button variant="link" asChild>
            <Link href="/clubs">Browse clubs</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
