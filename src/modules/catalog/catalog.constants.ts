import type { ProductSort } from "@/types/commerce";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

export const ALLOWED_SORTS: ProductSort[] = ["featured", "newest", "price-asc", "price-desc"];

export function normalizePageSize(pageSize?: number): number {
  const size = pageSize ?? DEFAULT_PAGE_SIZE;
  return Math.min(MAX_PAGE_SIZE, Math.max(1, size));
}

export function sortToOrderBy(sort: ProductSort | undefined) {
  switch (sort) {
    case "price-asc":
      return { priceMinor: "asc" as const };
    case "price-desc":
      return { priceMinor: "desc" as const };
    case "newest":
      return { createdAt: "desc" as const };
    case "featured":
    default:
      return [{ featured: "desc" as const }, { createdAt: "desc" as const }];
  }
}
