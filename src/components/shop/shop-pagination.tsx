import Link from "next/link";

import { buildShopQueryString } from "@/lib/shop-search-params";
import type { ProductFilters } from "@/types/commerce";

export function ShopPagination({
  filters,
  totalPages,
}: {
  filters: ProductFilters;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  const page = filters.page ?? 1;

  return (
    <nav className="flex gap-2 mt-8" aria-label="Pagination">
      {page > 1 && (
        <Link
          className="filter-chip"
          href={`/shop?${buildShopQueryString({ ...filters, page: page - 1 })}`}
        >
          Previous
        </Link>
      )}
      <span className="filter-chip active">
        Page {page} of {totalPages}
      </span>
      {page < totalPages && (
        <Link
          className="filter-chip"
          href={`/shop?${buildShopQueryString({ ...filters, page: page + 1 })}`}
        >
          Next
        </Link>
      )}
    </nav>
  );
}
