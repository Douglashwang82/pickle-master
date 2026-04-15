"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import SessionCard from "@/components/sessions/SessionCard";
import SessionForm from "@/components/sessions/SessionForm";
import ApplicationReview from "@/components/clubs/ApplicationReview";
import ClubForm from "@/components/clubs/ClubForm";
import ApplyDialog from "@/components/clubs/ApplyDialog";
import ClubAnalytics from "@/components/clubs/ClubAnalytics";
import AnnounceDialog from "@/components/clubs/AnnounceDialog";
import type { SessionWithSpots } from "@/types/domain";
import type { ClubAnalyticsData } from "@/app/api/clubs/[clubId]/analytics/route";

type ClubData = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  rules: string | null;
  cover_image_url: string | null;
  sport_type: string;
  public_status: "public" | "private";
  owner_user_id: string;
};

type MemberRow = {
  id: string;
  role: string;
  status: string;
  user_id: string;
  joined_at: string;
  profile: {
    display_name: string;
    photo_url: string | null;
    skill_level: string | null;
    bio: string | null;
  } | null;
};

type ApplicationRow = {
  id: string;
  user_id: string;
  intro_message: string | null;
  created_at: string;
  profiles: {
    display_name: string;
    photo_url: string | null;
    skill_level: string | null;
    bio: string | null;
  } | null;
};

type VenueOption = {
  id: string;
  name: string;
  district?: string;
};

type Props = {
  club: ClubData;
  initialTab: string;
  isLeader: boolean;
  isMember: boolean;
  memberCount: number;
  sessions: SessionWithSpots[];
  members: MemberRow[];
  applications: ApplicationRow[];
  venues: VenueOption[];
  currentApplication: { id: string; status: string } | null;
  analyticsData: ClubAnalyticsData | null;
};

export default function ClubDetailTabs({
  club,
  initialTab,
  isLeader,
  isMember,
  memberCount,
  sessions,
  members,
  applications,
  venues,
  currentApplication,
  analyticsData,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [createSessionOpen, setCreateSessionOpen] = useState(false);

  function switchTab(tab: string) {
    setActiveTab(tab);
    router.replace(`/clubs/${club.slug}?tab=${tab}`, { scroll: false });
  }

  const pendingCount = applications.length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Cover image */}
      {club.cover_image_url && (
        <div className="aspect-video overflow-hidden rounded-xl">
          <img src={club.cover_image_url} alt={club.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Club header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{club.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="capitalize">{club.sport_type}</Badge>
            <span className="text-sm text-muted-foreground">{memberCount} 位成員</span>
          </div>
        </div>
        {isLeader && (
          <div className="shrink-0 pt-1">
            <AnnounceDialog clubId={club.id} memberCount={memberCount} />
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={switchTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="sessions">場次</TabsTrigger>
          {isMember && (
            <TabsTrigger value="members" className="gap-1.5">
              成員
              {isLeader && pendingCount > 0 && (
                <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="info">資訊</TabsTrigger>
          {isLeader && <TabsTrigger value="analytics">數據分析</TabsTrigger>}
          {isLeader && <TabsTrigger value="settings">設定</TabsTrigger>}
        </TabsList>

        {/* ── Sessions tab ── */}
        <TabsContent value="sessions" className="mt-6 space-y-4">
          {isLeader && (
            <div className="flex justify-end">
              <Sheet open={createSessionOpen} onOpenChange={setCreateSessionOpen}>
                <SheetTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-1" />
                    建立場次
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
                  <SheetHeader className="mb-4">
                    <SheetTitle>新場次</SheetTitle>
                    <p className="text-sm text-muted-foreground">{club.name}</p>
                  </SheetHeader>
                  <SessionForm
                    clubId={club.id}
                    clubSlug={club.slug}
                    venues={venues}
                    onCancel={() => setCreateSessionOpen(false)}
                  />
                </SheetContent>
              </Sheet>
            </div>
          )}

          {sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((s) => (
                <SessionCard key={s.id} session={s} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <p>暫無即將舉辦的場次。</p>
              {isLeader && (
                <Button variant="link" onClick={() => setCreateSessionOpen(true)}>
                  立即建立
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── Members tab ── */}
        {isMember && (
          <TabsContent value="members" className="mt-6 space-y-6">
            {isLeader && pendingCount > 0 && (
              <div className="space-y-3">
                <h2 className="text-base font-semibold">
                  待審申請（{pendingCount}）
                </h2>
                {applications.map((app) => (
                  <ApplicationReview
                    key={app.id}
                    application={app}
                    clubId={club.id}
                  />
                ))}
                <Separator />
              </div>
            )}

            <div className="space-y-3">
              <h2 className="text-base font-semibold">
                正式成員（{members.length}）
              </h2>
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={m.profile?.photo_url ?? undefined} />
                      <AvatarFallback>{m.profile?.display_name?.[0] ?? "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{m.profile?.display_name ?? "未知"}</p>
                      {m.profile?.skill_level && (
                        <p className="text-xs text-muted-foreground capitalize">{m.profile.skill_level}</p>
                      )}
                    </div>
                    <Badge variant={m.role === "leader" ? "default" : "secondary"} className="capitalize">
                      {m.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        )}

        {/* ── Info tab ── */}
        <TabsContent value="info" className="mt-6 space-y-4">
          {club.description && (
            <p className="text-muted-foreground">{club.description}</p>
          )}

          {club.rules && (
            <>
              <Separator />
              <div>
                <h2 className="font-semibold mb-2">社團規則</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{club.rules}</p>
              </div>
            </>
          )}

          {!club.description && !club.rules && (
            <p className="text-muted-foreground text-sm">尚未添加任何資訊。</p>
          )}

          {!isMember && (
            <>
              <Separator />
              <ApplyDialog
                clubId={club.id}
                clubSlug={club.slug}
                currentApplication={currentApplication}
              />
            </>
          )}
        </TabsContent>

        {/* ── Analytics tab (leader only) ── */}
        {isLeader && (
          <TabsContent value="analytics" className="mt-6">
            {analyticsData ? (
              <ClubAnalytics data={analyticsData} />
            ) : (
              <p className="text-sm text-muted-foreground">數據分析暫不可用。</p>
            )}
          </TabsContent>
        )}

        {/* ── Settings tab (leader only) ── */}
        {isLeader && (
          <TabsContent value="settings" className="mt-6">
            <ClubForm club={club} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
