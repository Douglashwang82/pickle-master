import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { data: club } = await supabaseAdmin
    .from("clubs")
    .select("name, description")
    .eq("slug", slug)
    .eq("status", "active")
    .eq("public_status", "public")
    .single();

  if (!club) return { title: "社團不存在 | PickleMaster" };
  return {
    title: `${club.name} | PickleMaster`,
    description: club.description ?? undefined,
  };
}

function formatSessionDate(isoString: string): string {
  const date = new Date(isoString);
  const weekdays = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
  const day = weekdays[date.getDay()];
  const month = date.getMonth() + 1;
  const d = date.getDate();
  const hour = date.getHours().toString().padStart(2, "0");
  const minute = date.getMinutes().toString().padStart(2, "0");
  return `${day} ${month}/${d} · ${hour}:${minute}`;
}

export default async function PublicClubProfilePage({ params }: Params) {
  const { slug } = await params;

  // Only show public, active clubs
  const { data: club } = await supabaseAdmin
    .from("clubs")
    .select("id, slug, name, description, rules, cover_image_url, district, membership_type, public_status, status, created_at")
    .eq("slug", slug)
    .eq("status", "active")
    .eq("public_status", "public")
    .single();

  if (!club) notFound();

  // Member count
  const { count: memberCount } = await supabaseAdmin
    .from("club_memberships")
    .select("*", { count: "exact", head: true })
    .eq("club_id", club.id)
    .eq("status", "active");

  // Next 3 upcoming sessions
  const { data: sessions } = await supabaseAdmin
    .from("sessions")
    .select("id, title, scheduled_start_at, scheduled_end_at, max_participants, venue_id")
    .eq("club_id", club.id)
    .in("status", ["published", "full"])
    .gte("scheduled_start_at", new Date().toISOString())
    .order("scheduled_start_at", { ascending: true })
    .limit(3);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Back link */}
      <Link
        href="/clubs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← 所有社團
      </Link>

      {/* Cover image */}
      <div className="relative rounded-2xl overflow-hidden">
        {club.cover_image_url ? (
          <div className="aspect-[16/7]">
            <img
              src={club.cover_image_url}
              alt={club.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-[16/7] bg-secondary flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-background flex items-center justify-center shadow-sm">
              <span className="text-primary font-black text-3xl">{club.name.substring(0, 2).toUpperCase()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Club header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {club.district && (
            <Badge variant="secondary">{club.district}</Badge>
          )}
          {club.membership_type === "open" ? (
            <Badge className="bg-accent text-accent-foreground">公開加入</Badge>
          ) : (
            <Badge variant="secondary">需申請</Badge>
          )}
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{club.name}</h1>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>👥 {memberCount ?? 0} 位成員</span>
        </div>

        {club.description && (
          <p className="text-muted-foreground leading-relaxed">{club.description}</p>
        )}
      </div>

      {/* Upcoming sessions */}
      {sessions && sessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold">即將舉辦的場次</h2>
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-card"
              >
                <div className="space-y-0.5">
                  <p className="font-semibold text-sm">{session.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSessionDate(session.scheduled_start_at)}
                  </p>
                </div>
                {session.max_participants && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    最多 {session.max_participants} 人
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules */}
      {club.rules && (
        <div className="space-y-2">
          <h2 className="text-lg font-bold">社團規則</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{club.rules}</p>
        </div>
      )}

      {/* CTA block */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-bold text-lg">想加入這個社團？</p>
          <p className="text-sm text-muted-foreground">
            {club.membership_type === "open"
              ? "登入後即可立即加入，無需等待審核。"
              : "登入後提交申請，等待社長審核。"}
          </p>
        </div>
        <Button asChild className="rounded-full font-bold px-8 shrink-0">
          <Link href={`/login?redirect=/clubs/${club.slug}`}>
            {club.membership_type === "open" ? "立即加入" : "申請加入"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
