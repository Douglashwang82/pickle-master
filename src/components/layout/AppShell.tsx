"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Users, Calendar, User, LogOut, Cpu, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useLanguage } from "@/lib/i18n/context";
import LanguageToggle from "./LanguageToggle";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLanguage();

  const navItems = [
    { href: "/clubs", label: t("nav.clubs"), icon: Users },
    { href: "/dashboard", label: t("nav.sessions"), icon: Calendar },
    { href: "/venues", label: t("nav.venues"), icon: MapPin },
    { href: "/profile", label: t("nav.profile"), icon: User },
  ];

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/clubs" className="flex items-center gap-2 font-black tracking-tight text-primary hover:opacity-80 transition-opacity">
            <div className="w-2.5 h-2.5 rounded-full bg-accent" />
            PickleMaster
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200",
                  pathname.startsWith(href)
                    ? "bg-accent/20 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-primary hover:bg-secondary"
                )}
              >
                <Icon className={cn("h-4 w-4", pathname.startsWith(href) ? "text-accent-foreground" : "")} />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <LanguageToggle className="hidden sm:flex" />
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="font-semibold text-muted-foreground hover:text-primary hover:bg-secondary rounded-full px-4">
              <LogOut className="h-4 w-4 mr-2" />
              {t("nav.signOut")}
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex border-t border-border/40 bg-background pb-safe">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-wider font-bold transition-colors select-none",
                pathname.startsWith(href)
                  ? "text-primary bg-accent/10"
                  : "text-muted-foreground hover:bg-secondary/50"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-0.5", pathname.startsWith(href) ? "text-accent" : "")} />
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 md:py-12 animate-in fade-in duration-500">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
