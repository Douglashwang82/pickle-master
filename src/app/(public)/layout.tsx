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
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top navigation */}
      <header className="px-6 md:px-12 py-5 flex items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <Link
          href="/"
          className="text-2xl font-black tracking-tighter text-primary flex items-center gap-2"
        >
          <div className="w-3 h-3 rounded-full bg-accent" />
          PickleMaster
        </Link>

        <nav className="flex items-center gap-4">
          <LanguageToggle className="hidden sm:flex mr-2" />
          <Link href="/sessions">
            <Button variant="ghost" className="text-primary font-medium hover:bg-secondary hidden sm:inline-flex">
              {t("nav.browseSessions")}
            </Button>
          </Link>
          <Link href="/clubs">
            <Button variant="ghost" className="text-primary font-medium hover:bg-secondary hidden sm:inline-flex">
              {t("nav.findClubs")}
            </Button>
          </Link>
          {user ? (
            <Link href="/dashboard">
              <Button className="font-semibold shadow-sm rounded-full px-6">
                {t("nav.myDashboard")}
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-primary font-medium hover:bg-secondary">
                  {t("nav.signIn")}
                </Button>
              </Link>
              <Link href="/login">
                <Button className="font-semibold shadow-sm rounded-full px-6">
                  {t("nav.getStarted")}
                </Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="flex-1 px-4 md:px-8 lg:px-12 py-8 max-w-screen-xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
