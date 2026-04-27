import { Skeleton } from "@/components/ui/skeleton";

export default function ClubsLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
      {/* Title + search */}
      <div className="space-y-4">
        <Skeleton className="h-9 w-32" />
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-64 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
      </div>

      {/* Club cards grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/50 bg-card overflow-hidden">
            <Skeleton className="aspect-video w-full" />
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-10 w-full rounded-full mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
