"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { buildShopQueryString, parseShopSearchParams } from "@/lib/shop-search-params";
import type { ProductFilters } from "@/types/commerce";

type ShopFilterPatch = {
  [K in keyof ProductFilters]?: ProductFilters[K] | undefined;
};

function mergeShopFilters(current: ProductFilters, patch: ShopFilterPatch): ProductFilters {
  const next: ProductFilters = { ...current, page: 1 };
  (Object.keys(patch) as (keyof ProductFilters)[]).forEach((key) => {
    const value = patch[key];
    if (value === undefined) {
      delete next[key];
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- keyed merge for filter patches
    (next as any)[key] = value;
  });
  return next;
}

export type OptimisticShopFiltersValue = ReturnType<typeof useOptimisticShopFilters>;

/** URL is source of truth; optimistic state keeps filter UI instant while the shop page refetches. */
export function useOptimisticShopFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<ProductFilters | null>(null);

  const urlFilters = useMemo(
    () =>
      parseShopSearchParams(Object.fromEntries(searchParams.entries()) as Record<string, string>),
    [searchParams],
  );

  useEffect(() => {
    setOptimistic(null);
  }, [searchParams]);

  const filters = optimistic ?? urlFilters;

  const applyFilters = useCallback(
    (patch: ShopFilterPatch) => {
      const next = mergeShopFilters(filters, patch);
      setOptimistic(next);
      const qs = buildShopQueryString(next);
      startTransition(() => {
        router.push(qs ? `/shop?${qs}` : "/shop");
      });
    },
    [filters, router],
  );

  const clearCategory = useCallback(() => {
    applyFilters({ category: undefined });
  }, [applyFilters]);

  return { filters, applyFilters, clearCategory, isPending };
}
