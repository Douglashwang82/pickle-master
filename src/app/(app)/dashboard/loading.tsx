import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Hero section */}
      <section className="rounded-[2rem] border border-border/50 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-10 w-full max-w-xl" />
            <Skeleton className="h-5 w-full max-w-2xl" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-10 w-32 rounded-full" />
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-background/80 p-5 flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-12" />
              </div>
              <Skeleton className="h-12 w-12 rounded-2xl" />
            </div>
          ))}
        </div>
      </section>

      {/* Clubs + sessions grid */}
      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          {["Created clubs", "Joined clubs"].map((label) => (
            <section key={label} className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Skeleton className="h-7 w-36" />
                  <Skeleton className="h-4 w-52" />
                </div>
                <Skeleton className="h-9 w-28 rounded-full" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-44 rounded-2xl" />
                <Skeleton className="h-44 rounded-2xl" />
              </div>
            </section>
          ))}
        </div>

        <section className="space-y-4">
          <div className="space-y-1">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-60" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
