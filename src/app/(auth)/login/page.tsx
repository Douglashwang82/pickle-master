"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") ?? "";
  // Only allow relative paths to prevent open redirects
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/clubs";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const errorMessages: Record<string, string> = {
    auth_failed: "驗證失敗，請再試一次。",
    missing_code: "驗證連結無效，請重新登入。",
    user_creation_failed: "建立帳號時發生錯誤，請聯絡支援。",
  };
  const [error, setError] = useState<string | null>(
    errorParam ? (errorMessages[errorParam] ?? "發生未知錯誤，請再試一次。") : null
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${appUrl}/api/auth/callback?next=${next}` },
      });
      if (error) {
        setError(error.message);
      } else {
        setSuccessMsg("請查看您的電子郵件以確認帳號。");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        window.location.href = next;
      }
    }

    setLoading(false);
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${appUrl}/api/auth/callback?next=${next}` },
    });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-8 md:px-6 md:py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top_left,_rgba(38,112,88,0.15),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(243,222,77,0.18),_transparent_34%)]" />
      <div className="pointer-events-none absolute left-[-9rem] top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-8rem] top-32 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2.2rem] border border-border/70 bg-card/92 shadow-[0_40px_120px_-60px_rgba(16,42,31,0.55)] backdrop-blur-sm lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative hidden min-h-[42rem] overflow-hidden lg:block">
            <Image
              src="/images/home/general-image-2.jpg"
              alt="Pickleball paddles and balls on court"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,35,26,0.15)_0%,rgba(13,35,26,0.22)_40%,rgba(13,35,26,0.78)_100%)]" />
            <div className="absolute inset-x-8 bottom-8 rounded-[1.8rem] border border-white/15 bg-background/90 p-6 shadow-xl backdrop-blur-md">
              <p className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-primary/70">Club access</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground">讓第一次登入，也像進入一個有秩序的球團。</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                從公開探索頁一路進到登入流程，語氣和質感保持一致，讓成員知道這個社團是有標準的。
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center p-5 md:p-8 lg:p-10">
            <Card className="w-full max-w-md rounded-[1.8rem] border-border/70 bg-background/85 shadow-none">
              <CardHeader className="space-y-5 text-left">
                <div className="space-y-3">
                  <Link href="/" className="inline-flex items-center gap-3 text-primary">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground shadow-sm">
                      PM
                    </span>
                    <span className="text-xl font-black tracking-tight">PickleMaster</span>
                  </Link>
                  <div>
                    <CardTitle className="text-3xl font-black tracking-tight">
                      {mode === "signin" ? "登入您的帳號" : "建立新帳號"}
                    </CardTitle>
                    <CardDescription className="mt-2 text-sm leading-7">
                      {mode === "signin"
                        ? "回到您的社團與場次控制台，繼續處理本週的節奏。"
                        : "建立帳號後即可加入社團、追蹤場次，或開始打造自己的球團營運頁面。"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {successMsg && (
            <Alert>
              <AlertDescription>{successMsg}</AlertDescription>
            </Alert>
          )}

          <Button
            variant="outline"
            className="h-11 w-full rounded-full border-border/70 font-semibold"
            onClick={handleGoogleLogin}
            type="button"
          >
            使用 Google 登入
          </Button>

          <div className="flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">或</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="email">電子郵件</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded-2xl border-border/70 bg-card/80"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">密碼</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-2xl border-border/70 bg-card/80"
                required
                minLength={8}
              />
            </div>
            <Button type="submit" className="h-11 w-full rounded-full font-bold" disabled={loading}>
              {loading
                ? "載入中…"
                : mode === "signin"
                ? "登入"
                : "建立帳號"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                還沒有帳號？{" "}
                <button
                  className="underline hover:text-foreground"
                  onClick={() => setMode("signup")}
                >
                  註冊
                </button>
              </>
            ) : (
              <>
                已有帳號？{" "}
                <button
                  className="underline hover:text-foreground"
                  onClick={() => setMode("signin")}
                >
                  登入
                </button>
              </>
            )}
          </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">載入中...</div>}>
      <LoginContent />
    </Suspense>
  );
}
