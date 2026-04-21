import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 bg-background/75">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-12">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-7 w-40" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="hidden h-10 w-24 rounded-full sm:block" />
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 md:px-8 md:py-10 lg:px-12 lg:py-12">
        <section className="space-y-4">
          <Skeleton className="h-8 w-36 rounded-full" />
          <Skeleton className="h-12 w-full max-w-xl" />
          <Skeleton className="h-6 w-full max-w-2xl" />
        </section>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </section>
      </main>
    </div>
  );
}
