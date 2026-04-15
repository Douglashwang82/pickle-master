import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSkillLabel, getSkillColor } from "@/lib/constants/skills";
import type { ClubWithDiscovery } from "@/types/domain";

type Props = {
  club: ClubWithDiscovery;
};

function formatNextSession(isoString: string): string {
  const date = new Date(isoString);
  const weekdays = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
  const day = weekdays[date.getDay()];
  const month = date.getMonth() + 1;
  const d = date.getDate();
  const hour = date.getHours().toString().padStart(2, "0");
  const minute = date.getMinutes().toString().padStart(2, "0");
  return `${day} ${month}/${d} · ${hour}:${minute}`;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export default function ClubCard({ club }: Props) {
  return (
    <Link href={`/clubs/${club.slug}`} className="block h-full group">
      <Card className="h-full border-border/40 bg-card overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 rounded-2xl flex flex-col">
        {/* Cover image */}
        <div className="relative">
          {club.cover_image_url ? (
            <div className="aspect-[16/10] overflow-hidden">
              <img
                src={club.cover_image_url}
                alt={club.name}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
              />
            </div>
          ) : (
            <div className="aspect-[16/10] bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
              <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center shadow-sm">
                <span className="text-primary font-black text-xl">{club.name.substring(0, 2).toUpperCase()}</span>
              </div>
            </div>
          )}

          {/* Bottom-left: district + distance */}
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {club.district && (
              <Badge variant="secondary" className="bg-background/90 backdrop-blur-md text-foreground border-none shadow-sm text-[10px] font-bold tracking-wide px-2.5 py-0.5">
                {club.district}
              </Badge>
            )}
            {club.distance_km != null && (
              <Badge variant="secondary" className="bg-background/90 backdrop-blur-md text-foreground border-none shadow-sm text-[10px] font-bold tracking-wide px-2.5 py-0.5">
                📍 {formatDistance(club.distance_km)}
              </Badge>
            )}
          </div>

          {/* Top-right: membership type */}
          <div className="absolute top-3 right-3">
            {club.membership_type === "open" ? (
              <Badge className="bg-accent text-accent-foreground border-none shadow-sm text-[10px] font-bold tracking-wide px-2.5 py-0.5">
                公開加入
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-background/90 backdrop-blur-md text-foreground border-none shadow-sm text-[10px] font-bold tracking-wide px-2.5 py-0.5">
                需申請
              </Badge>
            )}
          </div>
        </div>

        {/* Club name */}
        <CardHeader className="pb-2 pt-5">
          <h3 className="font-extrabold text-xl leading-tight group-hover:text-primary transition-colors">{club.name}</h3>
        </CardHeader>

        {/* Description + skill badges + stats */}
        <CardContent className="pb-5 flex-1 flex flex-col justify-between gap-3">
          {club.description && (
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{club.description}</p>
          )}

          {/* Skill level badges */}
          {club.skill_levels && club.skill_levels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {club.skill_levels.map((s) => (
                <span
                  key={s}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getSkillColor(s)}`}
                >
                  {getSkillLabel(s)}
                </span>
              ))}
            </div>
          )}

          {/* Social proof row */}
          <div className="flex flex-col gap-1 mt-auto pt-3 border-t border-border/40">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span>👥</span>
                <span>{club.member_count} 位成員</span>
              </span>
              {club.upcoming_session_count > 0 && (
                <span className="flex items-center gap-1">
                  <span>📅</span>
                  <span>{club.upcoming_session_count} 場即將舉辦</span>
                </span>
              )}
            </div>
            <div className="text-xs">
              {club.next_session_at ? (
                <span className="text-primary font-medium">
                  下一場：{formatNextSession(club.next_session_at)}
                </span>
              ) : (
                <span className="text-muted-foreground">近期無排程場次</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
