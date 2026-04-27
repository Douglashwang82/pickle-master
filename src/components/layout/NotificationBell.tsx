"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type AppNotification = {
  id: string;
  type: string;
  payload_json: Record<string, unknown>;
  status: string;
  created_at: string;
};

function renderNotification(n: AppNotification): string {
  const p = n.payload_json;
  switch (n.type) {
    case "club_announcement": {
      const sender = typeof p.sender_name === "string" ? p.sender_name : "Club leader";
      const club = typeof p.club_name === "string" ? p.club_name : "your club";
      const msg = typeof p.message === "string" ? p.message : "";
      return `${sender} (${club}): ${msg}`;
    }
    case "membership_approved": {
      const club = typeof p.club_name === "string" ? p.club_name : "社團";
      return `您加入「${club}」的申請已通過審核，歡迎加入！`;
    }
    case "payment_reminder": {
      const title = typeof p.session_title === "string" ? p.session_title : "場次";
      const amt = typeof p.amount_twd === "number" ? `NT$${p.amount_twd}` : "";
      return `「${title}」付款提醒${amt ? `：${amt} 待繳` : ""}。`;
    }
    case "session_reminder_24h": {
      const title = typeof p.title === "string" ? p.title : "場次";
      return `提醒：「${title}」將在 24 小時後開始。`;
    }
    case "waitlist_promoted": {
      const title = typeof p.session_title === "string" ? p.session_title : "場次";
      const amt = typeof p.amount_twd === "number" ? `NT$${p.amount_twd}` : "費用";
      return `候補遞補成功：您已加入「${title}」，請留意 ${amt} 的待繳款項。`;
    }
    default:
      return n.type.replace(/_/g, " ");
  }
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const unreadCount = notifications.filter((n) => n.status === "pending").length;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/me/notifications");
      if (res.ok) {
        const data: unknown = await res.json();
        if (Array.isArray(data)) {
          setNotifications(data as AppNotification[]);
          setHasFetched(true);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Defer initial fetch until after first paint so it doesn't compete with page data
    const timer = setTimeout(fetchNotifications, 2000);
    return () => clearTimeout(timer);
  }, [fetchNotifications]);

  async function handleOpen(next: boolean) {
    setOpen(next);
    if (next) {
      if (!hasFetched) {
        await fetchNotifications();
      }
      if (unreadCount > 0) {
        setNotifications((prev) =>
          prev.map((n) => (n.status === "pending" ? { ...n, status: "sent" } : n))
        );
        await fetch("/api/me/notifications", { method: "PATCH" });
      }
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative rounded-full px-3 text-muted-foreground hover:text-primary hover:bg-secondary"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-semibold">通知</p>
          {notifications.length > 0 && (
            <button
              onClick={() => fetchNotifications()}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              重新整理
            </button>
          )}
        </div>
        <Separator />
        <div className={cn("max-h-80 overflow-y-auto", loading && "opacity-60")}>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center text-muted-foreground">
              目前沒有任何通知。
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "px-4 py-3 text-sm",
                    n.status === "pending" && "bg-accent/10"
                  )}
                >
                  <p className="leading-snug">{renderNotification(n)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
