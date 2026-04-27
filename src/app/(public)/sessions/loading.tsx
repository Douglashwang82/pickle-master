import { Skeleton } from "@/components/ui/skeleton";

export default function SessionsLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:px-8">
      {/* Title + filters */}
      <div className="space-y-4">
        <Skeleton className="h-9 w-40" />
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-36 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
      </div>

      {/* Session cards */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/50 bg-card p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
