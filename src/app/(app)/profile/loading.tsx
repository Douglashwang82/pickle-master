import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      {/* Page title */}
      <div className="flex flex-col border-b border-border/40 pb-6 space-y-3">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Reputation card */}
      <div className="rounded-2xl border border-border/40 overflow-hidden">
        <div className="bg-secondary/30 p-5 border-b border-border/40">
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="p-6 space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-10 w-2/3 rounded-xl" />
        </div>
      </div>

      {/* Profile form card */}
      <div className="rounded-2xl border border-border/40 overflow-hidden">
        <div className="bg-secondary/30 p-5 border-b border-border/40">
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="p-6 space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
          <Skeleton className="h-12 w-36 rounded-full mt-4" />
        </div>
      </div>
    </div>
  );
}
