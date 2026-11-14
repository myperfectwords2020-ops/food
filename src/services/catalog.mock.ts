import { products as rawProducts } from "@/lib/skincare-data";
import type { Product, ProductFilters, ProductListResult } from "@/types/commerce";

import type { CatalogService } from "./catalog.service";

const DEFAULT_USAGE =
  "Apply to clean skin as part of your daily routine. Introduce new products gradually.";
const DEFAULT_WARNINGS =
  "Patch test before first use. Discontinue use if persistent irritation occurs. This guidance is not medical advice.";

function enrich(p: (typeof rawProducts)[number]): Product {
  return {
    ...p,
    usageInstructions: DEFAULT_USAGE,
    warnings: DEFAULT_WARNINGS,
    createdAt: "2026-01-15",
  };
}

const catalog: Product[] = rawProducts.map(enrich);

function normalizeConcern(value: string) {
  return value.toLowerCase().replaceAll("-", " ").trim();
}

function matchesConcern(product: Product, concern?: string) {
  if (!concern) return true;
  return normalizeConcern(product.concern).includes(normalizeConcern(concern));
}

function matchesSkinType(product: Product, skinType?: string) {
  if (!skinType) return true;
  const needle = skinType.toLowerCase();
  return product.skinTypes.some(
    (t) => t.toLowerCase() === needle || t.toLowerCase() === "all skin types",
  );
}

function sortProducts(items: Product[], sort: ProductFilters["sort"]): Product[] {
  const copy = [...items];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price-desc":
      return copy.sort((a, b) => b.price - a.price);
    case "newest":
      return copy.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    case "featured":
    default:
      return copy.sort((a, b) => Number(Boolean(b.badge)) - Number(Boolean(a.badge)));
  }
}

export const mockCatalogService: CatalogService = {
  async listProducts(filters) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(48, Math.max(1, filters.pageSize ?? 12));
    let items = [...catalog];

    if (filters.q) {
      const q = filters.q.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.concern.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }
    if (filters.category && filters.category !== "All") {
      items = items.filter((p) => p.category === filters.category);
    }
    items = items.filter(
      (p) => matchesConcern(p, filters.concern) && matchesSkinType(p, filters.skinType),
    );
    if (filters.minPrice != null) {
      items = items.filter((p) => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice != null) {
      items = items.filter((p) => p.price <= filters.maxPrice!);
    }

    items = sortProducts(items, filters.sort ?? "featured");
    const total = items.length;
    const start = (page - 1) * pageSize;
    const paged = items.slice(start, start + pageSize);

    return {
      items: paged,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  async getProductBySlug(slug) {
    return catalog.find((p) => p.slug === slug) ?? null;
  },

  async getProductById(id) {
    return catalog.find((p) => p.id === id) ?? null;
  },

  async getRelatedProducts(slug, limit = 3) {
    const current = catalog.find((p) => p.slug === slug);
    if (!current) return catalog.slice(0, limit);
    return catalog
      .filter(
        (p) =>
          p.slug !== slug && (p.category === current.category || p.concern === current.concern),
      )
      .slice(0, limit);
  },

  async getCompleteRoutineProducts(slug) {
    const order = ["Cleanser", "Serum", "Moisturizer", "Sunscreen", "Toner"];
    const current = catalog.find((p) => p.slug === slug);
    const picked: Product[] = [];
    for (const cat of order) {
      const match = catalog.find(
        (p) => p.category === cat && p.slug !== slug && !picked.some((x) => x.id === p.id),
      );
      if (match) picked.push(match);
    }
    if (current && !picked.some((p) => p.id === current.id)) {
      picked.unshift(current);
    }
    return picked.slice(0, 4);
  },

  async listCategories() {
    return [...new Set(catalog.map((p) => p.category))].sort();
  },

  async listSkinTypes() {
    const set = new Set<string>();
    for (const p of catalog) {
      for (const t of p.skinTypes) set.add(t);
    }
    return [...set].sort();
  },

  async listConcerns() {
    return [...new Set(catalog.map((p) => p.concern))].sort();
  },
};
