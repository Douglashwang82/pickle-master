import { supabaseAdmin } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { isNextResponse, requireAuth } from "@/lib/utils/auth-guard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const auth = await requireAuth();
  if (isNextResponse(auth)) redirect("/login");

  // Upcoming confirmed registrations
  const { data: registrations } = await supabaseAdmin
    .from("session_registrations")
    .select(`
      id, status, joined_at,
      sessions(id, title, scheduled_start_at, location_name, fee_twd, status,
        clubs(slug, name))
    `)
    .eq("user_id", auth.appUserId)
    .eq("status", "confirmed")
    .order("joined_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">我的場次</h1>

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
                    <Link href={`/sessions/${session.id}`}>查看場次</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p>尚無即將到來的場次。</p>
          <Button variant="link" asChild>
            <Link href="/clubs">瀏覽社團</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
