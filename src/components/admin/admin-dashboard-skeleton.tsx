import { Skeleton } from "@/components/ui/skeleton";

export function AdminDashboardSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="metric-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full mt-4" />
    </div>
  );
}
