"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/context";
import LanguageToggle from "@/components/layout/LanguageToggle";

const features = [
  {
    label: "Sessions",
    title: "Create & Fill Sessions",
    desc: "Publish sessions, enforce capacity automatically, and let members join in one tap.",
  },
  {
    label: "Payments",
    title: "TWD-Native Payments",
    desc: "Collect dues and session fees with local payment rails, auto-refunds included.",
  },
  {
    label: "Members",
    title: "Live Roster Updates",
    desc: "Approve applications, manage roles, and watch attendance update in real time.",
  },
];

export default function RootPage() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-accent selection:text-accent-foreground">
      {/* Top Navigation */}
      <header className="px-6 md:px-12 py-5 flex items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="text-2xl font-black tracking-tighter text-primary flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent" />
          PickleMaster
        </div>
        <nav className="flex items-center gap-4">
          <LanguageToggle className="hidden sm:flex mr-2" />
          <Link href="/login">
            <Button variant="ghost" className="text-primary font-medium hover:bg-secondary">
              {t("nav.signIn")}
            </Button>
          </Link>
          <Link href="/clubs">
            <Button className="font-semibold shadow-sm rounded-full px-6">
              {t("nav.findClubs")}
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="relative flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 md:pt-36 md:pb-32 overflow-hidden">
          {/* Court-line decorations */}
          <div className="absolute inset-0 -z-10 pointer-events-none">
            {/* Concentric half-circles — evoke a pickleball court kitchen line */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[520px] h-[260px] rounded-t-[260px] border-2 border-primary/8" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[820px] h-[410px] rounded-t-[410px] border-2 border-primary/5" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1120px] h-[560px] rounded-t-[560px] border border-primary/[0.03]" />
            {/* Center service-line */}
            <div className="absolute bottom-0 left-1/2 -translate-x-px w-px h-64 bg-gradient-to-t from-primary/12 to-transparent" />
            {/* Ambient glows */}
            <div className="absolute top-16 left-[8%] w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
            <div className="absolute bottom-8 right-[8%] w-96 h-96 bg-primary/6 rounded-full blur-3xl" />
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out max-w-3xl mx-auto">
            <div className="inline-flex items-center px-4 py-1.5 mb-8 text-sm font-bold tracking-wide uppercase rounded-full bg-accent text-accent-foreground shadow-sm">
              {t("home.badge")}
            </div>

            <h1 className="text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold tracking-tight mb-6 leading-[1.05] text-foreground">
              {t("home.title_part1")}
              <br />
              <span className="text-primary">{t("home.title_part2")}</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed max-w-lg mx-auto">
              {t("home.description")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/clubs">
                <Button
                  size="lg"
                  className="w-full sm:w-auto font-bold shadow-md text-base px-8 rounded-full h-14"
                >
                  {t("home.exploreClubs")}
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto font-bold text-base px-8 border-primary/20 text-primary hover:bg-secondary hover:border-primary/50 rounded-full h-14 transition-all"
                >
                  {t("home.leaderLogin")}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <section className="px-6 md:px-12 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 ease-out">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.label}
                className="rounded-2xl bg-card border border-border p-8 flex flex-col gap-3 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <span className="text-xs font-bold tracking-widest uppercase text-accent-foreground bg-accent/20 px-2.5 py-1 rounded-full w-fit">
                  {f.label}
                </span>
                <h3 className="text-base font-bold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
