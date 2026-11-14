"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

import { ShopFilterControls } from "@/components/shop/shop-filter-controls";
import { Button } from "@/components/ui/button";
import { useShopFilters } from "@/components/shop/shop-filters-provider";
import type { ProductSort } from "@/types/commerce";

export function ShopToolbar({
  categories,
  skinTypes,
  concerns,
}: {
  categories: string[];
  skinTypes: string[];
  concerns: string[];
}) {
  const { filters, applyFilters, clearCategory, isPending } = useShopFilters();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <div className="filter-toolbar" aria-busy={isPending}>
        <div className="filter-chips">
          <button
            type="button"
            className={`filter-chip ${!filters.category ? "active" : ""}`}
            onClick={() => clearCategory()}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              type="button"
              key={c}
              className={`filter-chip ${filters.category === c ? "active" : ""}`}
              onClick={() => applyFilters({ category: c })}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <Button
            type="button"
            variant="outline"
            className="mobile-filter-trigger"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <SlidersHorizontal size={16} /> Filters
          </Button>
          <select
            aria-label="Sort products"
            className="filter-chip"
            value={filters.sort ?? "featured"}
            onChange={(e) => applyFilters({ sort: e.target.value as ProductSort })}
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>
      {drawerOpen && (
        <div className="filter-drawer-backdrop" onClick={() => setDrawerOpen(false)} aria-hidden />
      )}
      <div
        className={`filter-drawer ${drawerOpen ? "open" : ""}`}
        role="dialog"
        aria-modal={drawerOpen}
        aria-label="Product filters"
      >
        <div className="filter-drawer-head">
          <h2 className="text-sm font-bold">Filters</h2>
          <Button
            type="button"
            variant="icon"
            aria-label="Close filters"
            onClick={() => setDrawerOpen(false)}
          >
            <X />
          </Button>
        </div>
        <ShopFilterControls categories={categories} skinTypes={skinTypes} concerns={concerns} />
        <Button type="button" className="w-full mt-4" onClick={() => setDrawerOpen(false)}>
          View results
        </Button>
      </div>
    </>
  );
}
