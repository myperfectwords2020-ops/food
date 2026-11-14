import type { ProductFilters, ProductSort } from "@/types/commerce";

const SORTS: ProductSort[] = ["featured", "price-asc", "price-desc", "newest"];

export function parseShopSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): ProductFilters {
  const get = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const sortRaw = get("sort");
  const sort = SORTS.includes(sortRaw as ProductSort) ? (sortRaw as ProductSort) : "featured";
  const page = Number(get("page") ?? "1");
  const minRaw = get("minPrice");
  const maxRaw = get("maxPrice");
  const minPrice = minRaw ? Number(minRaw) : undefined;
  const maxPrice = maxRaw ? Number(maxRaw) : undefined;

  const filters: ProductFilters = {
    sort,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: 12,
  };

  const q = get("q");
  if (q) filters.q = q;
  const category = get("category");
  if (category) filters.category = category;
  const skinType = get("skinType");
  if (skinType) filters.skinType = skinType;
  const concern = get("concern");
  if (concern) filters.concern = concern;
  if (minPrice != null && Number.isFinite(minPrice)) filters.minPrice = minPrice;
  if (maxPrice != null && Number.isFinite(maxPrice)) filters.maxPrice = maxPrice;

  return filters;
}

export function buildShopQueryString(filters: ProductFilters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.skinType) params.set("skinType", filters.skinType);
  if (filters.concern) params.set("concern", filters.concern);
  if (filters.minPrice != null) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice != null) params.set("maxPrice", String(filters.maxPrice));
  if (filters.sort && filters.sort !== "featured") params.set("sort", filters.sort);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  return params.toString();
}
