"use client";

import { Suspense } from "react";

import { EmptyState } from "@/components/page-ui";
import { ProductCard } from "@/components/product-card";
import { ShopFilterAside } from "@/components/shop/shop-filter-aside";
import { ShopFiltersProvider, useShopFilters } from "@/components/shop/shop-filters-provider";
import { SearchBox } from "@/components/shop/search-box";
import { ShopPagination } from "@/components/shop/shop-pagination";
import { ShopProductGridSkeleton } from "@/components/shop/shop-product-grid-skeleton";
import { ShopToolbar } from "@/components/shop/shop-toolbar";
import type { ProductFilters, ProductListResult } from "@/types/commerce";

type Props = {
  filterOptions: {
    categories: string[];
    skinTypes: string[];
    concerns: string[];
  };
  filters: ProductFilters;
  result: ProductListResult;
};

export function ShopPageShell({ filterOptions, filters, result }: Props) {
  return (
    <ShopFiltersProvider>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading filters…</p>}>
        <SearchBox />
        <ShopToolbar {...filterOptions} />
      </Suspense>
      <div className="shop-layout">
        <Suspense fallback={null}>
          <ShopFilterAside {...filterOptions} />
        </Suspense>
        <ShopResults filters={filters} result={result} />
      </div>
    </ShopFiltersProvider>
  );
}

function ShopResults({ filters, result }: { filters: ProductFilters; result: ProductListResult }) {
  const { isPending } = useShopFilters();
  const skeletonCount = result.items.length || result.pageSize || 12;

  if (isPending) {
    return (
      <div aria-busy="true" aria-live="polite" className="shop-results-loading">
        <p className="text-xs text-muted-foreground mb-4 flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin"
            aria-hidden
          />
          Updating results…
        </p>
        <ShopProductGridSkeleton count={skeletonCount} />
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-4" role="status">
        {result.total} {result.total === 1 ? "product" : "products"}
        {filters.q ? ` for “${filters.q}”` : ""}
      </p>
      {result.items.length === 0 ? (
        <EmptyState
          title={filters.q ? `Nothing matched “${filters.q}”` : "No products match these filters"}
          copy={
            filters.q
              ? "Try a simpler word like “apple” or “milk”, or clear a filter."
              : "Try clearing a filter or browsing the full collection."
          }
        />
      ) : (
        <>
          <div className="shop-grid">
            {result.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <ShopPagination filters={filters} totalPages={result.totalPages} />
        </>
      )}
    </div>
  );
}
