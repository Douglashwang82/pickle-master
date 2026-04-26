import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  CircleDollarSign,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type SessionRowData = {
  id: string;
  title: string;
  status: string;
  scheduled_start_at: string;
  capacity: number;
  fee_twd: number;
  location_name: string | null;
  confirmed_count: number;
  paid_count: number;
  refund_count: number;
};

type Props = { session: SessionRowData };

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "草稿", variant: "outline" },
  published: { label: "已發布", variant: "secondary" },
  full: { label: "已額滿", variant: "default" },
  cancelled: { label: "已取消", variant: "destructive" },
  completed: { label: "已完成", variant: "outline" },
  auto_closed: { label: "已關閉", variant: "outline" },
};

export default function SessionRow({ session }: Props) {
  const fillPct =
    session.capacity > 0
      ? Math.min(100, Math.round((session.confirmed_count / session.capacity) * 100))
      : 0;
  const badge = STATUS_BADGE[session.status] ?? {
    label: session.status,
    variant: "outline" as const,
  };

  return (
    <Link href={`/sessions/${session.id}`} className="block">
      <Card className="transition-colors hover:border-primary/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="line-clamp-1 text-base font-semibold">
                {session.title}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {format(new Date(session.scheduled_start_at), "yyyy/MM/dd EEE")}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {format(new Date(session.scheduled_start_at), "HH:mm")}
                </span>
                {session.location_name && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{session.location_name}</span>
                  </span>
                )}
              </div>
            </div>
            <Badge variant={badge.variant} className="shrink-0">
              {badge.label}
            </Badge>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {session.confirmed_count} / {session.capacity} 人
              </span>
              <span className="font-medium text-foreground">{fillPct}%</span>
            </div>
            <Progress value={fillPct} className="h-1.5" />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <CircleDollarSign className="h-3.5 w-3.5" />
              {session.fee_twd > 0 ? `NT$${session.fee_twd}` : "免費"}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1",
                session.paid_count > 0 ? "text-emerald-600" : "text-muted-foreground"
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              已付 {session.paid_count}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1",
                session.confirmed_count > session.paid_count
                  ? "text-amber-600"
                  : "text-muted-foreground"
              )}
            >
              <AlertCircle className="h-3.5 w-3.5" />
              未付 {Math.max(0, session.confirmed_count - session.paid_count)}
            </span>
            {session.refund_count > 0 && (
              <span className="inline-flex items-center gap-1 text-red-500">
                <XCircle className="h-3.5 w-3.5" />
                退費 {session.refund_count}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
