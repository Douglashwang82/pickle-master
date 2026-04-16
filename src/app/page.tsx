"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/context";
import LanguageToggle from "@/components/layout/LanguageToggle";

const PickleballScene = dynamic(
  () => import("@/components/home/PickleballScene"),
  { ssr: false },
);

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
      {/* Top Navigation — slides down from above */}
      <header className="px-6 md:px-12 py-5 flex items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50 animate-in slide-in-from-top-4 fade-in duration-500 ease-out">
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
        <section className="relative flex flex-col lg:flex-row items-center justify-between px-6 md:px-12 pt-24 pb-20 md:pt-32 md:pb-28 gap-10 overflow-hidden">
          {/* Court-line decorations — grow outward from center */}
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div
              className="animate-court-grow absolute bottom-0 left-1/2 w-[520px] h-[260px] rounded-t-[260px] border-2 border-primary/8"
              style={{ animationDelay: "0.4s" }}
            />
            <div
              className="animate-court-grow absolute bottom-0 left-1/2 w-[820px] h-[410px] rounded-t-[410px] border-2 border-primary/5"
              style={{ animationDelay: "0.6s" }}
            />
            <div
              className="animate-court-grow absolute bottom-0 left-1/2 w-[1120px] h-[560px] rounded-t-[560px] border border-primary/[0.03]"
              style={{ animationDelay: "0.8s" }}
            />
            {/* Center service-line */}
            <div className="absolute bottom-0 left-1/2 -translate-x-px w-px h-64 bg-gradient-to-t from-primary/12 to-transparent" />
          </div>

          {/* Left column: text */}
          <div className="max-w-xl w-full text-center lg:text-left mx-auto lg:mx-0">
            {/* Badge — spring pop entrance */}
            <div className="animate-pop inline-flex items-center px-4 py-1.5 mb-8 text-sm font-bold tracking-wide uppercase rounded-full bg-accent text-accent-foreground shadow-sm">
              {t("home.badge")}
            </div>

            {/* H1 — two lines staggered */}
            <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-extrabold tracking-tight mb-6 leading-[1.05] text-foreground">
              <span
                className="block animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out"
                style={{ animationDelay: "150ms", animationFillMode: "both" }}
              >
                {t("home.title_part1")}
              </span>
              <span
                className="block text-primary animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out"
                style={{ animationDelay: "320ms", animationFillMode: "both" }}
              >
                {t("home.title_part2")}
              </span>
            </h1>

            {/* Description */}
            <p
              className="animate-in fade-in duration-700 ease-out text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed max-w-md mx-auto lg:mx-0"
              style={{ animationDelay: "520ms", animationFillMode: "both" }}
            >
              {t("home.description")}
            </p>

            {/* CTA Buttons — staggered after description */}
            <div
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              style={{ animationDelay: "720ms", animationFillMode: "both" }}
            >
              {/* Primary button with one-time shimmer sweep */}
              <div className="relative overflow-hidden rounded-full">
                <Link href="/clubs">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto font-bold shadow-md text-base px-8 rounded-full h-14"
                  >
                    {t("home.exploreClubs")}
                  </Button>
                </Link>
                <span className="shimmer-overlay rounded-full" />
              </div>
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

          {/* Right column: 3D pickleball — desktop only */}
          <div
            className="hidden lg:block w-[460px] h-[460px] flex-shrink-0"
            aria-hidden="true"
          >
            <PickleballScene />
          </div>
        </section>

        {/* Feature cards — cascade left-to-right with hover lift */}
        <section className="px-6 md:px-12 pb-24">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={f.label}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out rounded-2xl bg-card border border-border p-8 flex flex-col gap-3 hover:border-primary/30 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                style={{ animationDelay: `${820 + i * 120}ms`, animationFillMode: "both" }}
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
