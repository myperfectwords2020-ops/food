"use client";

import { createContext, useContext, type ReactNode } from "react";

import {
  useOptimisticShopFilters,
  type OptimisticShopFiltersValue,
} from "@/hooks/use-optimistic-shop-filters";

const ShopFiltersContext = createContext<OptimisticShopFiltersValue | null>(null);

export function ShopFiltersProvider({ children }: { children: ReactNode }) {
  const value = useOptimisticShopFilters();
  return <ShopFiltersContext.Provider value={value}>{children}</ShopFiltersContext.Provider>;
}

export function useShopFilters() {
  const ctx = useContext(ShopFiltersContext);
  if (!ctx) {
    throw new Error("useShopFilters must be used within ShopFiltersProvider");
  }
  return ctx;
}
