"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTWD } from "@/lib/charts/tokens";

export type MemberRow = {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  display_name: string;
  photo_url: string | null;
  skill_level: string | null;
  attendance_90d: number;
  total_paid: number;
  last_active_at: string | null;
};

type SortKey =
  | "name"
  | "skill"
  | "role"
  | "joined"
  | "attendance"
  | "paid"
  | "last_active";

type Props = { members: MemberRow[] };

const SORT_OPTIONS: Array<{ key: SortKey; label: string; align?: string }> = [
  { key: "name", label: "成員" },
  { key: "skill", label: "級別" },
  { key: "role", label: "角色" },
  { key: "joined", label: "加入日" },
  { key: "attendance", label: "90 日出席", align: "text-right" },
  { key: "paid", label: "累計付款", align: "text-right" },
  { key: "last_active", label: "最近活躍" },
];

const SKILL_RANK: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  pro: 4,
};

function formatRelativeDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays} 天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} 週前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} 個月前`;
  return `${Math.floor(diffDays / 365)} 年前`;
}

export default function MembersTable({ members }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  const sort = (params.get("sort") as SortKey) ?? "joined";
  const dir = (params.get("dir") as "asc" | "desc") ?? "desc";

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = members;
    if (needle) {
      out = out.filter((m) =>
        m.display_name.toLowerCase().includes(needle)
      );
    }
    out = [...out].sort((a, b) => {
      let cmp = 0;
      if (sort === "name") cmp = a.display_name.localeCompare(b.display_name);
      else if (sort === "skill")
        cmp = (SKILL_RANK[a.skill_level ?? ""] ?? 0) - (SKILL_RANK[b.skill_level ?? ""] ?? 0);
      else if (sort === "role") cmp = a.role.localeCompare(b.role);
      else if (sort === "joined") cmp = a.joined_at.localeCompare(b.joined_at);
      else if (sort === "attendance")
        cmp = a.attendance_90d - b.attendance_90d;
      else if (sort === "paid") cmp = a.total_paid - b.total_paid;
      else if (sort === "last_active")
        cmp = (a.last_active_at ?? "").localeCompare(b.last_active_at ?? "");
      return dir === "asc" ? cmp : -cmp;
    });
    return out;
  }, [members, q, sort, dir]);

  function setSort(key: SortKey) {
    const u = new URLSearchParams(params.toString());
    if (sort === key) {
      u.set("dir", dir === "asc" ? "desc" : "asc");
    } else {
      u.set("sort", key);
      u.set("dir", "desc");
    }
    router.replace(`${pathname}?${u.toString()}`, { scroll: false });
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sort !== k)
      return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return dir === "asc" ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜尋成員姓名…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <p className="text-xs text-muted-foreground shrink-0">
          {filtered.length} / {members.length} 位
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {SORT_OPTIONS.map((opt) => (
                <TableHead
                  key={opt.key}
                  className={cn(
                    "text-xs uppercase tracking-wide",
                    opt.align,
                    "cursor-pointer select-none"
                  )}
                  onClick={() => setSort(opt.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {opt.label}
                    <SortIcon k={opt.key} />
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={SORT_OPTIONS.length}
                  className="text-center text-sm text-muted-foreground py-10"
                >
                  沒有符合條件的成員
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={m.photo_url ?? undefined} />
                        <AvatarFallback>{m.display_name[0] ?? "?"}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{m.display_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {m.skill_level ? (
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {m.skill_level}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={m.role === "leader" ? "default" : "secondary"}
                      className="capitalize text-[10px]"
                    >
                      {m.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(m.joined_at).toLocaleDateString("zh-TW")}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium tabular-nums">
                    {m.attendance_90d}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium tabular-nums">
                    {m.total_paid > 0 ? formatTWD(m.total_paid) : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatRelativeDate(m.last_active_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
