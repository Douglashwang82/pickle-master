"use client";

import { useLanguage } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLanguage();

  return (
    <div className={cn("flex items-center bg-secondary/50 p-1 rounded-full border border-border/40", className)}>
      <button
        onClick={() => setLocale("zh-TW")}
        className={cn(
          "px-3 py-1 text-xs font-bold rounded-full transition-all duration-200",
          locale === "zh-TW"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-primary hover:bg-secondary"
        )}
      >
        繁中
      </button>
      <button
        onClick={() => setLocale("en")}
        className={cn(
          "px-3 py-1 text-xs font-bold rounded-full transition-all duration-200",
          locale === "en"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-primary hover:bg-secondary"
        )}
      >
        EN
      </button>
    </div>
  );
}
