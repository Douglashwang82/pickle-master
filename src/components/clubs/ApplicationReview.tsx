"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type Props = {
  application: {
    id: string;
    intro_message: string | null;
    created_at: string;
    profiles: {
      display_name: string;
      photo_url: string | null;
      skill_level: string | null;
      bio: string | null;
    } | null;
  };
  clubId: string;
};

export default function ApplicationReview({ application, clubId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const profile = application.profiles;

  async function handle(action: "approve" | "reject") {
    setLoading(action);
    await fetch(`/api/clubs/${clubId}/applications/${application.id}/${action}`, {
      method: "POST",
    });
    router.refresh();
    setLoading(null);
  }

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.photo_url ?? undefined} />
            <AvatarFallback>{profile?.display_name?.[0] ?? "?"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{profile?.display_name ?? "未知"}</p>
            {profile?.skill_level && (
              <Badge variant="outline" className="text-xs capitalize">
                {profile.skill_level}
              </Badge>
            )}
          </div>
        </div>

        {profile?.bio && (
          <p className="text-sm text-muted-foreground">{profile.bio}</p>
        )}

        {application.intro_message && (
          <div className="bg-muted rounded-md p-3">
            <p className="text-sm italic">&ldquo;{application.intro_message}&rdquo;</p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            onClick={() => handle("approve")}
            disabled={loading !== null}
          >
            {loading === "approve" ? "核准中…" : "核准"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handle("reject")}
            disabled={loading !== null}
          >
            {loading === "reject" ? "拒絕中…" : "拒絕"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
