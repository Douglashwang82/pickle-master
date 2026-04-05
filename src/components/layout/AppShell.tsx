"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Users, Calendar, User, LogOut, Cpu, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";

const navItems = [
  { href: "/clubs", label: "Clubs", icon: Users },
  { href: "/dashboard", label: "My Sessions", icon: Calendar },
  { href: "/venues", label: "Venues", icon: MapPin },
  { href: "/profile", label: "Profile", icon: User },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/clubs" className="flex items-center gap-2 font-semibold">
            <Cpu className="h-5 w-5" />
            PickleMaster
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                  pathname.startsWith(href)
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-1" />
            Sign out
          </Button>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex border-t">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors",
                pathname.startsWith(href)
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">{children}</main>
      <Toaster />
    </div>
  );
}
