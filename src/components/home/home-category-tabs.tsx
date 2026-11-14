"use client";

import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";

import { ProductCard } from "@/components/product-card";
import type { Product } from "@/types/commerce";

const FILTERS = [
  { id: "all", label: "All", categories: [] },
  { id: "fruits", label: "Fruits", categories: ["Fruits"] },
  { id: "vegetables", label: "Vegetables", categories: ["Vegetables"] },
  { id: "meat-fish", label: "Meat & Fish", categories: ["Meat & Fish"] },
  { id: "dairy", label: "Milk & Dairy", categories: ["Milk & Dairy"] },
  { id: "bakery", label: "Bakery", categories: ["Bread & Bakery"] },
  { id: "drinks-snacks", label: "Drinks & Snacks", categories: ["Drinks", "Snacks & Sweets"] },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];
type SortOrder = "none" | "asc" | "desc";

const NEXT_SORT: Record<SortOrder, SortOrder> = { none: "asc", asc: "desc", desc: "none" };
const SORT_LABEL: Record<SortOrder, string> = {
  none: "Sort By Price",
  asc: "Price: Low to High",
  desc: "Price: High to Low",
};

export function HomeCategoryTabs({ products }: { products: Product[] }) {
  const [active, setActive] = useState<FilterId>("all");
  const [sort, setSort] = useState<SortOrder>("none");

  const visible = useMemo(() => {
    const filter = FILTERS.find((f) => f.id === active);
    const allowed: readonly string[] = filter?.categories ?? [];
    const list = allowed.length ? products.filter((p) => allowed.includes(p.category)) : products;
    const sorted =
      sort === "none"
        ? list
        : [...list].sort((a, b) => (sort === "asc" ? a.price - b.price : b.price - a.price));
    return sorted.slice(0, 6);
  }, [active, products, sort]);

  return (
    <>
      <div className="gc-filter-bar">
        <div className="gc-filter-pills" role="group" aria-label="Filter products">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className="gc-pill"
              aria-pressed={active === filter.id}
              onClick={() => setActive(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <button type="button" className="gc-pill" onClick={() => setSort(NEXT_SORT[sort])}>
          <ArrowUpDown size={14} aria-hidden />
          {SORT_LABEL[sort]}
        </button>
      </div>
      <div className="gc-product-grid" aria-live="polite">
        {visible.length === 0 ? (
          <p className="gc-empty">
            No products in this aisle yet. <Link href="/shop">Browse everything</Link>
          </p>
        ) : (
          visible.map((product) => <ProductCard key={product.id} product={product} />)
        )}
      </div>
    </>
  );
}
