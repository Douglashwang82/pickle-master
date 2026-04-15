import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

// Public layout: no auth gate. Shows Login or Dashboard based on session state.
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
          <Link href="/sessions">
            <Button variant="ghost" className="text-primary font-medium hover:bg-secondary hidden sm:inline-flex">
              瀏覽場次
            </Button>
          </Link>
          <Link href="/clubs">
            <Button variant="ghost" className="text-primary font-medium hover:bg-secondary hidden sm:inline-flex">
              探索社團
            </Button>
          </Link>
          {user ? (
            <Link href="/dashboard">
              <Button className="font-semibold shadow-sm rounded-full px-6">
                我的儀表板
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-primary font-medium hover:bg-secondary">
                  登入
                </Button>
              </Link>
              <Link href="/login">
                <Button className="font-semibold shadow-sm rounded-full px-6">
                  開始使用
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
