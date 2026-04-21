"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/context";
import LanguageToggle from "@/components/layout/LanguageToggle";
import type { User } from "@supabase/supabase-js";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top_left,_rgba(38,112,88,0.14),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(243,222,77,0.18),_transparent_34%)]" />
      <div className="pointer-events-none absolute left-[-10rem] top-24 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-8rem] top-40 -z-10 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />

      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-12">
          <Link href="/" className="flex items-center gap-3 text-primary">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground shadow-sm">
              PM
            </span>
            <span className="text-xl font-black tracking-tight md:text-2xl">PickleMaster</span>
          </Link>

          <nav className="flex items-center gap-3 md:gap-4">
            <LanguageToggle className="hidden sm:flex" />
            <Link href="/sessions">
              <Button variant="ghost" className="hidden font-semibold text-primary hover:bg-secondary sm:inline-flex">
                {t("nav.browseSessions")}
              </Button>
            </Link>
            <Link href="/clubs">
              <Button variant="ghost" className="hidden font-semibold text-primary hover:bg-secondary sm:inline-flex">
                {t("nav.findClubs")}
              </Button>
            </Link>
            {user ? (
              <Link href="/dashboard">
                <Button className="rounded-full px-5 font-semibold shadow-sm md:px-6">
                  {t("nav.myDashboard")}
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="font-semibold text-primary hover:bg-secondary">
                    {t("nav.signIn")}
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="rounded-full px-5 font-semibold shadow-sm md:px-6">
                    {t("nav.getStarted")}
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-8 md:px-8 md:py-10 lg:px-12 lg:py-12">
        {children}
      </main>
    </div>
  );
}
