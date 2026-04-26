"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type PendingApplication = {
  id: string;
  user_id: string;
  intro_message: string | null;
  created_at: string;
  profile: {
    display_name: string;
    photo_url: string | null;
    skill_level: string | null;
  } | null;
};

type Props = { clubId: string; applications: PendingApplication[] };

export default function PendingApplicationsPanel({ clubId, applications }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(applications.length > 0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  if (applications.length === 0) return null;

  function toggle(id: string) {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelected(s);
  }
  function selectAll() {
    if (selected.size === applications.length) setSelected(new Set());
    else setSelected(new Set(applications.map((a) => a.id)));
  }

  async function batch(action: "approve" | "reject") {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/clubs/${clubId}/applications/batch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids: Array.from(selected),
            action,
          }),
        }
      );
      if (res.ok) {
        setSelected(new Set());
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border-amber-200 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium">
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  open ? "rotate-0" : "-rotate-90"
                )}
              />
              待審申請
              <Badge variant="default" className="ml-1">
                {applications.length}
              </Badge>
            </CollapsibleTrigger>

            {open && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={selectAll}
                  disabled={busy}
                >
                  {selected.size === applications.length ? "取消全選" : "全選"}
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => batch("approve")}
                  disabled={selected.size === 0 || busy}
                >
                  <Check className="h-4 w-4 mr-1" />
                  批次核准 ({selected.size})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => batch("reject")}
                  disabled={selected.size === 0 || busy}
                >
                  <X className="h-4 w-4 mr-1" />
                  拒絕
                </Button>
              </div>
            )}
          </div>

          <CollapsibleContent>
            <div className="mt-4 space-y-2">
              {applications.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 rounded-md border bg-card p-3"
                >
                  <Checkbox
                    checked={selected.has(a.id)}
                    onCheckedChange={() => toggle(a.id)}
                    disabled={busy}
                    className="mt-1"
                  />
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={a.profile?.photo_url ?? undefined} />
                    <AvatarFallback>
                      {a.profile?.display_name?.[0] ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">
                        {a.profile?.display_name ?? "未知"}
                      </p>
                      {a.profile?.skill_level && (
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {a.profile.skill_level}
                        </Badge>
                      )}
                    </div>
                    {a.intro_message && (
                      <p className="mt-1 text-xs italic text-muted-foreground line-clamp-2">
                        “{a.intro_message}”
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}
