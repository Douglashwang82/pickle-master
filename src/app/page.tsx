"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/context";
import LanguageToggle from "@/components/layout/LanguageToggle";

export default function RootPage() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-accent selection:text-accent-foreground">
      {/* Top Navigation */}
      <header className="px-6 md:px-12 py-5 flex items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="text-2xl font-black tracking-tighter text-primary flex items-center gap-2">
          {/* A small green circle as a subtle logo accent */}
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

      <main className="flex-1 flex flex-col md:flex-row">
        {/* Left Content Area */}
        <div className="flex-[1.2] flex flex-col justify-center px-8 md:px-16 lg:px-24 py-16 md:py-24 relative">
          {/* Subtle background decoration */}
          <div className="absolute top-20 left-10 w-64 h-64 bg-accent/10 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />

          <div className="max-w-xl animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
            <div className="inline-flex items-center px-4 py-1.5 mb-8 text-sm font-bold tracking-wide uppercase rounded-full bg-accent text-accent-foreground shadow-sm">
              {t("home.badge")}
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-[5rem] font-extrabold tracking-tight mb-8 leading-[1.1] text-foreground">
              {t("home.title_part1")} <br />
              <span className="text-primary">{t("home.title_part2")}</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed max-w-md">
              {t("home.description")}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/clubs">
                <Button size="lg" className="w-full sm:w-auto font-bold shadow-md text-base px-8 rounded-full h-14">
                  {t("home.exploreClubs")}
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto font-bold text-base px-8 border-primary/20 text-primary hover:bg-secondary hover:border-primary/50 rounded-full h-14 transition-all">
                  {t("home.leaderLogin")}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Image Area */}
        <div className="flex-1 relative min-h-[50vh] md:min-h-auto bg-secondary overflow-hidden">
          {/* Gradient overlays to blend the image softly */}
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-transparent to-background/20 z-10" />
          
          <Image
            src="/images/home/general-image-1.jpg"
            alt="Pickleball paddles and balls on a court with a premium aesthetic"
            fill
            className="object-cover object-center animate-in fade-in zoom-in-95 duration-1000 ease-out"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </main>
    </div>
  );
}
