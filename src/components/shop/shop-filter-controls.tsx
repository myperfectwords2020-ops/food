"use client";

import { useShopFilters } from "@/components/shop/shop-filters-provider";
import type { ProductFilters } from "@/types/commerce";

type Props = {
  categories: string[];
  skinTypes: string[];
  concerns: string[];
};

export function ShopFilterControls({ categories, skinTypes, concerns }: Props) {
  const { filters, applyFilters } = useShopFilters();

  return (
    <>
      {[
        ["Category", "category", categories],
        ["Dietary", "skinType", skinTypes],
        ["Good for", "concern", concerns],
      ].map(([title, key, options]) => (
        <div key={key as string}>
          <h3>{title}</h3>
          <div className="check-list">
            {(options as string[]).map((option) => {
              const active = filters[key as keyof typeof filters] === option;
              return (
                <label key={option}>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() =>
                      applyFilters({
                        [key as keyof ProductFilters]: active ? undefined : option,
                      } as Partial<ProductFilters>)
                    }
                  />{" "}
                  {option}
                </label>
              );
            })}
          </div>
        </div>
      ))}
      <div>
        <h3>Price range (₦)</h3>
        <div className="check-list">
          <label>
            Min{" "}
            <input
              aria-label="Minimum price"
              className="filter-chip w-full mt-1"
              key={`min-${filters.minPrice ?? ""}`}
              defaultValue={filters.minPrice ?? ""}
              onBlur={(e) => {
                if (!e.target.value) {
                  applyFilters({ minPrice: undefined });
                  return;
                }
                applyFilters({ minPrice: Number(e.target.value) });
              }}
            />
          </label>
          <label>
            Max{" "}
            <input
              aria-label="Maximum price"
              className="filter-chip w-full mt-1"
              key={`max-${filters.maxPrice ?? ""}`}
              defaultValue={filters.maxPrice ?? ""}
              onBlur={(e) => {
                if (!e.target.value) {
                  applyFilters({ maxPrice: undefined });
                  return;
                }
                applyFilters({ maxPrice: Number(e.target.value) });
              }}
            />
          </label>
        </div>
      </div>
    </>
  );
}
