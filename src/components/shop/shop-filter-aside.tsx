"use client";

import { ShopFilterControls } from "@/components/shop/shop-filter-controls";

export function ShopFilterAside(props: {
  categories: string[];
  skinTypes: string[];
  concerns: string[];
}) {
  return (
    <aside className="filter-panel">
      <ShopFilterControls {...props} />
    </aside>
  );
}
