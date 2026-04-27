"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Users, Calendar, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useLanguage } from "@/lib/i18n/context";
import LanguageToggle from "./LanguageToggle";
import NotificationBell from "./NotificationBell";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { t } = useLanguage();

  const navItems = [
    { href: "/dashboard", label: "首頁", icon: Calendar, match: ["/dashboard", "/sessions"] },
    { href: "/clubs", label: t("nav.clubs"), icon: Users, match: ["/clubs"] },
    { href: "/profile", label: t("nav.profile"), icon: User, match: ["/profile"] },
  ];

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top_left,_rgba(38,112,88,0.14),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(243,222,77,0.18),_transparent_34%)]" />
      <div className="pointer-events-none absolute left-[-10rem] top-24 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-8rem] top-40 -z-10 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />

      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-12">
          <Link href="/dashboard" className="flex items-center gap-3 text-primary">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground shadow-sm">
              PM
            </span>
            <span className="text-xl font-black tracking-tight md:text-2xl">PickleMaster</span>
          </Link>

          <nav className="hidden md:flex items-center gap-3 md:gap-4">
            {navItems.map(({ href, label, icon: Icon, match }) => {
              const isActive = match.some((m) => pathname.startsWith(m));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-primary hover:bg-secondary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <LanguageToggle className="hidden sm:flex" />
            <NotificationBell />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="rounded-full font-semibold text-primary hover:bg-secondary"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t("nav.signOut")}
            </Button>
          </div>
        </div>

        <nav className="md:hidden flex border-t border-border/40 bg-background/85 pb-safe backdrop-blur-xl">
          {navItems.map(({ href, label, icon: Icon, match }) => {
            const isActive = match.some((m) => pathname.startsWith(m));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-wider font-bold transition-colors select-none",
                  isActive ? "bg-primary text-primary-foreground" : "text-primary hover:bg-secondary/50"
                )}
              >
                <Icon className="h-5 w-5 mb-0.5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-8 md:px-8 md:py-10 lg:px-12 lg:py-12 animate-in fade-in duration-500">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
