"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/context";
import LanguageToggle from "@/components/layout/LanguageToggle";

function CourtIllustration() {
  // Top-down pickleball court SVG (singles court proportions: 20ft wide × 44ft long)
  return (
    <svg
      viewBox="0 0 200 440"
      width="200"
      height="400"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      {/* Outer court */}
      <rect x="4" y="4" width="192" height="432" fill="#2196b0" stroke="#ffffff" strokeWidth="5" />

      {/* Kitchen zones (NVZ) */}
      <rect x="4" y="4" width="192" height="120" fill="#1a82a0" />
      <rect x="4" y="316" width="192" height="120" fill="#1a82a0" />

      {/* Kitchen lines */}
      <line x1="4" y1="124" x2="196" y2="124" stroke="#ffffff" strokeWidth="4" />
      <line x1="4" y1="316" x2="196" y2="316" stroke="#ffffff" strokeWidth="4" />

      {/* Center service lines */}
      <line x1="100" y1="124" x2="100" y2="220" stroke="#ffffff" strokeWidth="3" />
      <line x1="100" y1="220" x2="100" y2="316" stroke="#ffffff" strokeWidth="3" />

      {/* Net */}
      <rect x="4" y="215" width="192" height="10" fill="#ffffff" opacity="0.9" rx="2" />
      {/* Net grid lines */}
      {[22, 40, 58, 76, 94, 112, 130, 148, 166, 184].map((x) => (
        <line key={x} x1={x} y1="215" x2={x} y2="225" stroke="#aac" strokeWidth="1" opacity="0.6" />
      ))}
      {/* Net posts */}
      <rect x="0" y="210" width="8" height="20" fill="#d0e8ff" rx="2" />
      <rect x="192" y="210" width="8" height="20" fill="#d0e8ff" rx="2" />

      {/* Pickleball */}
      <circle cx="140" cy="170" r="14" fill="#d7ef4c" stroke="#8faa00" strokeWidth="3" />
      {/* Ball holes hint */}
      {[
        [136, 166], [144, 166], [140, 174],
        [133, 172], [147, 172],
      ].map(([hx, hy], i) => (
        <circle key={i} cx={hx} cy={hy} r="2" fill="#8faa00" opacity="0.7" />
      ))}
    </svg>
  );
}

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
        <section className="relative flex flex-col items-center px-6 md:px-12 pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
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

          {/* Hero text — centered */}
          <div className="max-w-2xl w-full text-center mx-auto">
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
              className="animate-in fade-in duration-700 ease-out text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed max-w-md mx-auto"
              style={{ animationDelay: "520ms", animationFillMode: "both" }}
            >
              {t("home.description")}
            </p>

            {/* CTA Buttons — staggered after description */}
            <div
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out flex flex-col sm:flex-row gap-4 justify-center"
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
