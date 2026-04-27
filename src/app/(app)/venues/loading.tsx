import { Skeleton } from "@/components/ui/skeleton";

export default function VenuesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-4 rounded-sm" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
