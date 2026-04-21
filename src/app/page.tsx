"use client";

import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  MapPinned,
  ShieldCheck,
  Sparkles,
  Users2,
} from "lucide-react";
import LanguageToggle from "@/components/layout/LanguageToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n/context";

type ProofKey = "applications" | "sessions" | "payments";
type FeatureKey = "orchestration" | "payments" | "community";
type RhythmKey = "clarity" | "capacity" | "followUp";
type AudienceKey = "leaders" | "members";
type DiscoveryKey = "clubs" | "sessions";

const proofItems: ReadonlyArray<{ key: ProofKey; icon: LucideIcon }> = [
  { key: "applications", icon: ShieldCheck },
  { key: "sessions", icon: CalendarDays },
  { key: "payments", icon: CreditCard },
];

const featureItems: ReadonlyArray<{ key: FeatureKey; icon: LucideIcon; accent: string }> = [
  { key: "orchestration", icon: CalendarDays, accent: "bg-primary/10 text-primary" },
  { key: "payments", icon: CreditCard, accent: "bg-accent/25 text-accent-foreground" },
  { key: "community", icon: Users2, accent: "bg-secondary text-secondary-foreground" },
];

const rhythmItems: ReadonlyArray<{ key: RhythmKey }> = [
  { key: "clarity" },
  { key: "capacity" },
  { key: "followUp" },
];

const audienceCards: ReadonlyArray<{ key: AudienceKey; icon: LucideIcon }> = [
  { key: "leaders", icon: Sparkles },
  { key: "members", icon: CheckCircle2 },
];

const discoveryCards: ReadonlyArray<{ key: DiscoveryKey; href: string; icon: LucideIcon }> = [
  { key: "clubs", href: "/clubs", icon: MapPinned },
  { key: "sessions", href: "/sessions", icon: CalendarDays },
];

const heroHighlights = [
  "home.hero.highlights.realtime",
  "home.hero.highlights.payments",
  "home.hero.highlights.approvals",
] as const;

const leaderPoints = [
  "home.rhythm.audience.leaders.points.one",
  "home.rhythm.audience.leaders.points.two",
  "home.rhythm.audience.leaders.points.three",
] as const;

const memberPoints = [
  "home.rhythm.audience.members.points.one",
  "home.rhythm.audience.members.points.two",
  "home.rhythm.audience.members.points.three",
] as const;

function HomeHeader() {
  const { t } = useLanguage();

  return (
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
          <Link href="/login">
            <Button variant="ghost" className="font-semibold text-primary hover:bg-secondary">
              {t("nav.signIn")}
            </Button>
          </Link>
          <Link href="/clubs">
            <Button className="rounded-full px-5 font-semibold shadow-sm md:px-6">
              {t("nav.findClubs")}
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default function RootPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent selection:text-accent-foreground">
      <HomeHeader />

      <main className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem] bg-[radial-gradient(circle_at_top_left,_rgba(38,112,88,0.16),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(243,222,77,0.22),_transparent_36%),linear-gradient(180deg,_rgba(255,255,255,0.12),_transparent_100%)]" />
        <div className="animate-glow-pulse pointer-events-none absolute left-[-10rem] top-20 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="animate-drift pointer-events-none absolute right-[-8rem] top-40 -z-10 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />

        <section className="relative px-6 pb-20 pt-16 md:px-12 md:pb-28 md:pt-20">
          <div className="pointer-events-none absolute inset-x-0 bottom-6 -z-10 hidden h-[28rem] lg:block">
            <div className="animate-court-grow absolute bottom-0 left-1/2 h-[220px] w-[520px] rounded-t-[220px] border border-primary/10" style={{ animationDelay: "0.2s" }} />
            <div className="animate-court-grow absolute bottom-0 left-1/2 h-[360px] w-[820px] rounded-t-[360px] border border-primary/6" style={{ animationDelay: "0.35s" }} />
            <div className="animate-court-grow absolute bottom-0 left-1/2 h-[500px] w-[1120px] rounded-t-[500px] border border-primary/[0.04]" style={{ animationDelay: "0.5s" }} />
          </div>

          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="relative z-10 max-w-2xl">
              <Badge className="animate-pop rounded-full border-none bg-accent px-4 py-1.5 text-[0.7rem] font-black uppercase tracking-[0.24em] text-accent-foreground shadow-sm">
                {t("home.hero.eyebrow")}
              </Badge>

              <h1 className="mt-7 text-5xl font-black leading-[0.96] tracking-tight text-foreground md:text-6xl lg:text-[5.5rem]">
                <span className="block animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out" style={{ animationDelay: "120ms", animationFillMode: "both" }}>
                  {t("home.hero.titleLead")}
                </span>
                <span className="block text-primary animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out" style={{ animationDelay: "240ms", animationFillMode: "both" }}>
                  {t("home.hero.titleAccent")}
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground animate-in fade-in duration-700 ease-out md:text-xl" style={{ animationDelay: "380ms", animationFillMode: "both" }}>
                {t("home.hero.description")}
              </p>

              <div className="mt-8 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out sm:flex-row" style={{ animationDelay: "520ms", animationFillMode: "both" }}>
                <div className="relative overflow-hidden rounded-full">
                  <Link href="/clubs">
                    <Button size="lg" className="h-14 rounded-full px-8 text-base font-bold shadow-md">
                      {t("home.hero.primaryCta")}
                    </Button>
                  </Link>
                  <span className="shimmer-overlay rounded-full" />
                </div>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="h-14 rounded-full border-primary/20 px-8 text-base font-bold text-primary hover:border-primary/50 hover:bg-secondary">
                    {t("home.hero.secondaryCta")}
                  </Button>
                </Link>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {heroHighlights.map((item, index) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-border/70 bg-background/80 px-4 py-4 text-sm font-semibold text-foreground shadow-[0_20px_60px_-36px_rgba(16,42,31,0.45)] backdrop-blur-sm animate-in fade-in slide-in-from-bottom-3 duration-500 ease-out"
                    style={{ animationDelay: `${620 + index * 110}ms`, animationFillMode: "both" }}
                  >
                    {t(item)}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[36rem] lg:mx-0 lg:ml-auto">
              <div className="animate-drift absolute -left-8 top-8 hidden h-28 w-28 rounded-[2rem] border border-primary/15 bg-background/75 blur-[1px] lg:block" />
              <div className="relative rounded-[2rem] border border-border/60 bg-card/85 p-3 shadow-[0_40px_120px_-50px_rgba(16,42,31,0.55)] backdrop-blur-md">
                <div className="relative aspect-[5/6] overflow-hidden rounded-[1.6rem]">
                  <Image
                    src="/images/home/general-image-1.jpg"
                    alt="Pickleball paddles and balls on a teal court"
                    fill
                    priority
                    className="object-cover"
                    sizes="(min-width: 1024px) 560px, 100vw"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,35,26,0.05)_0%,rgba(13,35,26,0.18)_42%,rgba(13,35,26,0.72)_100%)]" />
                  <div className="absolute left-5 right-5 top-5 flex items-center justify-between rounded-full bg-background/85 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary shadow-sm backdrop-blur">
                    <span>{t("home.hero.panel.label")}</span>
                    <span>{t("home.hero.panel.status")}</span>
                  </div>
                  <div className="absolute inset-x-5 bottom-5 rounded-[1.6rem] border border-white/20 bg-background/88 p-5 shadow-xl backdrop-blur-md">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-primary/80">{t("home.hero.panel.kicker")}</p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">{t("home.hero.panel.title")}</h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("home.hero.panel.description")}</p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-secondary/70 px-4 py-3">
                        <div className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-primary/70">{t("home.hero.panel.metricValueLabel")}</div>
                        <div className="mt-1 text-lg font-black text-foreground">{t("home.hero.panel.metricValue")}</div>
                      </div>
                      <div className="rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
                        <div className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-primary-foreground/70">{t("home.hero.panel.metricNoteLabel")}</div>
                        <div className="mt-1 text-lg font-black">{t("home.hero.panel.metricNote")}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Card className="absolute -bottom-8 -left-2 hidden w-64 overflow-hidden rounded-[1.7rem] border-border/70 bg-background/92 shadow-[0_28px_80px_-40px_rgba(16,42,31,0.5)] md:block">
                <div className="relative h-28 w-full">
                  <Image
                    src="/images/home/general-image-2.jpg"
                    alt="Pickleball gear arranged on court"
                    fill
                    className="object-cover"
                    sizes="256px"
                  />
                </div>
                <CardContent className="space-y-2 p-4">
                  <div className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-primary/70">{t("home.hero.sidecard.kicker")}</div>
                  <p className="text-sm font-semibold leading-6 text-foreground">{t("home.hero.sidecard.body")}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24 md:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-primary/70">{t("home.proof.eyebrow")}</p>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-foreground md:text-4xl">{t("home.proof.title")}</h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {proofItems.map(({ key, icon: Icon }) => (
                <Card key={key} className="rounded-[1.8rem] border-border/70 bg-card/90 shadow-[0_24px_80px_-50px_rgba(16,42,31,0.45)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/25">
                  <CardContent className="space-y-5 p-7">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-primary/70">{t(`home.proof.items.${key}.label`)}</p>
                      <h3 className="mt-2 text-xl font-black tracking-tight text-foreground">{t(`home.proof.items.${key}.title`)}</h3>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">{t(`home.proof.items.${key}.description`)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-24 md:px-12">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-primary/70">{t("home.features.eyebrow")}</p>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-foreground md:text-4xl">{t("home.features.title")}</h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground md:text-lg">{t("home.features.description")}</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {featureItems.map(({ key, icon: Icon, accent }, index) => (
                <Card
                  key={key}
                  className={`rounded-[1.8rem] border-border/70 bg-card/90 shadow-[0_24px_80px_-52px_rgba(16,42,31,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 ${index === 0 ? "md:col-span-2" : ""}`}
                >
                  <CardContent className="space-y-4 p-7">
                    <div className="flex items-center justify-between gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge variant="outline" className="rounded-full border-border/70 px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.2em] text-primary/80">
                        {t(`home.features.cards.${key}.label`)}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tight text-foreground">{t(`home.features.cards.${key}.title`)}</h3>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">{t(`home.features.cards.${key}.description`)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-24 md:px-12">
          <div className="mx-auto rounded-[2.2rem] border border-primary/10 bg-primary px-6 py-8 text-primary-foreground shadow-[0_36px_120px_-64px_rgba(16,42,31,0.7)] md:px-10 md:py-10 lg:max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-primary-foreground/70">{t("home.rhythm.eyebrow")}</p>
                <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight md:text-4xl">{t("home.rhythm.title")}</h2>
                <p className="mt-5 max-w-xl text-base leading-8 text-primary-foreground/78 md:text-lg">{t("home.rhythm.description")}</p>

                <div className="mt-8 space-y-4">
                  {rhythmItems.map(({ key }) => (
                    <div key={key} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                      <p className="text-sm leading-7 text-primary-foreground/84 md:text-base">{t(`home.rhythm.list.${key}`)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {audienceCards.map(({ key, icon: Icon }) => {
                  const points = key === "leaders" ? leaderPoints : memberPoints;

                  return (
                    <Card key={key} className="rounded-[1.8rem] border-white/10 bg-background text-foreground shadow-none">
                      <CardContent className="space-y-5 p-7">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-primary/70">{t(`home.rhythm.audience.${key}.label`)}</p>
                          <h3 className="mt-2 text-2xl font-black tracking-tight">{t(`home.rhythm.audience.${key}.title`)}</h3>
                        </div>
                        <div className="space-y-3">
                          {points.map((point) => (
                            <div key={point} className="flex items-start gap-3 text-sm leading-7 text-muted-foreground">
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                              <span>{t(point)}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-16 md:px-12 md:pb-24">
          <div className="mx-auto max-w-7xl rounded-[2.2rem] border border-border/70 bg-card/90 px-6 py-8 shadow-[0_24px_90px_-58px_rgba(16,42,31,0.45)] backdrop-blur-sm md:px-10 md:py-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-primary/70">{t("home.discovery.eyebrow")}</p>
                <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-foreground md:text-4xl">{t("home.discovery.title")}</h2>
                <p className="mt-4 text-base leading-8 text-muted-foreground md:text-lg">{t("home.discovery.description")}</p>
              </div>
              <Link href="/clubs">
                <Button variant="outline" className="h-12 rounded-full border-primary/20 px-6 font-bold text-primary hover:border-primary/50 hover:bg-secondary">
                  {t("home.discovery.secondaryCta")}
                </Button>
              </Link>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {discoveryCards.map(({ key, href, icon: Icon }) => (
                <Link key={key} href={href} className="group block h-full">
                  <Card className="h-full rounded-[1.8rem] border-border/70 bg-background/80 transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_20px_80px_-50px_rgba(16,42,31,0.4)]">
                    <CardContent className="flex h-full flex-col gap-5 p-7">
                      <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Icon className="h-6 w-6" />
                        </div>
                        <ArrowRight className="h-5 w-5 text-primary transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                      <div>
                        <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-primary/70">{t(`home.discovery.cards.${key}.label`)}</p>
                        <h3 className="mt-2 text-2xl font-black tracking-tight text-foreground">{t(`home.discovery.cards.${key}.title`)}</h3>
                        <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">{t(`home.discovery.cards.${key}.description`)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-20 md:px-12 md:pb-24">
          <div className="mx-auto max-w-5xl rounded-[2.4rem] border border-border/70 bg-secondary/55 px-6 py-10 text-center shadow-[0_20px_80px_-60px_rgba(16,42,31,0.55)] md:px-10 md:py-14">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-primary/70">{t("home.closing.eyebrow")}</p>
            <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black leading-tight tracking-tight text-foreground md:text-5xl">{t("home.closing.title")}</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">{t("home.closing.description")}</p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/clubs">
                <Button size="lg" className="h-14 rounded-full px-8 text-base font-bold shadow-sm">
                  {t("home.closing.primaryCta")}
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="h-14 rounded-full border-primary/20 px-8 text-base font-bold text-primary hover:border-primary/50 hover:bg-background">
                  {t("home.closing.secondaryCta")}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
