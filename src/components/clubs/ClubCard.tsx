import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Club } from "@/types/domain";

type Props = {
  club: Pick<Club, "id" | "slug" | "name" | "description" | "sport_type" | "cover_image_url" | "public_status" | "status">;
};

export default function ClubCard({ club }: Props) {
  return (
    <Link href={`/clubs/${club.slug}`} className="block h-full group">
      <Card className="h-full border-border/40 bg-card overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 rounded-2xl flex flex-col">
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
          <div className="absolute top-3 right-3">
             <Badge variant="secondary" className="bg-background/90 backdrop-blur-md text-foreground border-none shadow-sm capitalize font-bold text-[10px] tracking-wider px-3 py-1">
               {club.sport_type}
             </Badge>
          </div>
        </div>
        <CardHeader className="pb-2 pt-6">
          <h3 className="font-extrabold text-xl leading-tight group-hover:text-primary transition-colors">{club.name}</h3>
        </CardHeader>
        <CardContent className="pb-6 flex-1 flex flex-col justify-start">
          {club.description && (
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{club.description}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
