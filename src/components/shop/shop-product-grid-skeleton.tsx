import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_COUNT = 12;

export function ShopProductGridSkeleton({ count = DEFAULT_COUNT }: { count?: number }) {
  const n = Math.max(1, Math.min(count, 24));

  return (
    <div className="shop-grid" aria-hidden="true" data-testid="shop-product-grid-skeleton">
      {Array.from({ length: n }).map((_, i) => (
        <article key={i} className="product-card">
          <div className="product-image-wrap overflow-hidden">
            <Skeleton className="h-full min-h-[220px] w-full rounded-none bg-muted" />
          </div>
          <div className="product-copy space-y-2 pt-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-3 w-full mt-3" />
          <div className="tag-row flex gap-2 mt-3">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </article>
      ))}
    </div>
  );
}
