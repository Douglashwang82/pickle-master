import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Club } from "@/types/domain";

type Props = {
  club: Pick<Club, "id" | "slug" | "name" | "description" | "sport_type" | "cover_image_url" | "public_status" | "status">;
};

export default function ClubCard({ club }: Props) {
  return (
    <Link href={`/clubs/${club.slug}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        {club.cover_image_url && (
          <div className="aspect-video overflow-hidden rounded-t-lg">
            <img
              src={club.cover_image_url}
              alt={club.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">{club.name}</h3>
            <Badge variant="secondary" className="shrink-0 text-xs capitalize">
              {club.sport_type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {club.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{club.description}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
