"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { slug: string };

const NAV = [
  { key: "overview", label: "總覽", icon: LayoutDashboard },
  { key: "sessions", label: "場次", icon: CalendarDays },
  { key: "members", label: "成員", icon: Users },
  { key: "settings", label: "設定", icon: Settings },
] as const;

export default function ManageSidebar({ slug }: Props) {
  const pathname = usePathname();
  const base = `/clubs/${slug}/manage`;

  return (
    <nav className="lg:sticky lg:top-24 lg:self-start">
      {/* Mobile: horizontal scroll tab strip */}
      <ul className="flex gap-1 overflow-x-auto border-b lg:hidden">
        {NAV.map((item) => {
          const href = `${base}/${item.key}`;
          const active = pathname.startsWith(href);
          const Icon = item.icon;
          return (
            <li key={item.key} className="flex-shrink-0">
              <Link
                href={href}
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Desktop: vertical sidebar */}
      <ul className="hidden lg:flex lg:flex-col lg:gap-1">
        {NAV.map((item) => {
          const href = `${base}/${item.key}`;
          const active = pathname.startsWith(href);
          const Icon = item.icon;
          return (
            <li key={item.key}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
