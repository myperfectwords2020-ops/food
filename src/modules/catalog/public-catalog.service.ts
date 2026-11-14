import { cache } from "react";
import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/db/prisma";
import { resolvePublicTenantId } from "@/lib/tenants/public-tenant";
import {
  ALLOWED_SORTS,
  normalizePageSize,
  sortToOrderBy,
} from "@/modules/catalog/catalog.constants";
import { buildPublicProductWhere, normalizeCatalogQuery } from "@/modules/catalog/catalog-query";
import {
  catalogDetailProductInclude,
  catalogListProductSelect,
} from "@/modules/catalog/product.include";
import { toPublicProduct } from "@/modules/catalog/product.mapper";
import type { Product, ProductFilters, ProductListResult, ProductSort } from "@/types/commerce";

const ROUTINE_STEPS = ["CLEANSE", "TREAT", "MOISTURIZE", "PROTECT"] as const;

async function listPublicProductsUncached(
  tenantId: string,
  page: number,
  pageSize: number,
  sort: ProductSort,
  q: string,
  category: string,
  skinType: string,
  concern: string,
  minPrice: string,
  maxPrice: string,
): Promise<ProductListResult> {
  const filters: ProductFilters = { page, pageSize, sort };
  if (q) filters.q = q;
  if (category) filters.category = category;
  if (skinType) filters.skinType = skinType;
  if (concern) filters.concern = concern;
  if (minPrice) filters.minPrice = Number(minPrice);
  if (maxPrice) filters.maxPrice = Number(maxPrice);

  const where = await buildPublicProductWhere(tenantId, filters);

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      select: catalogListProductSelect,
      orderBy: sortToOrderBy(sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: rows.map(toPublicProduct),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

const cachedListPublicProducts = unstable_cache(
  listPublicProductsUncached,
  ["catalog-public-list"],
  { revalidate: 30 },
);

export async function listPublicProducts(filters: ProductFilters): Promise<ProductListResult> {
  const tenantId = await resolvePublicTenantId();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = normalizePageSize(filters.pageSize);
  const sort = ALLOWED_SORTS.includes(filters.sort ?? "featured")
    ? (filters.sort ?? "featured")
    : "featured";
  return cachedListPublicProducts(
    tenantId,
    page,
    pageSize,
    sort,
    normalizeCatalogQuery(filters.q),
    filters.category ?? "",
    filters.skinType ?? "",
    filters.concern ?? "",
    filters.minPrice != null ? String(filters.minPrice) : "",
    filters.maxPrice != null ? String(filters.maxPrice) : "",
  );
}

const cachedProductBySlug = unstable_cache(
  async (tenantId: string, slug: string): Promise<Product | null> => {
    const row = await prisma.product.findFirst({
      where: { tenantId, slug, status: "ACTIVE" },
      include: catalogDetailProductInclude,
    });
    return row ? toPublicProduct(row) : null;
  },
  ["catalog-product-slug"],
  { revalidate: 60 },
);

/** Dedupes product fetches within a single server render (page + metadata). */
export const getPublicProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const tenantId = await resolvePublicTenantId();
  return cachedProductBySlug(tenantId, slug);
});

export async function getPublicProductById(id: string): Promise<Product | null> {
  const tenantId = await resolvePublicTenantId();
  const row = await prisma.product.findFirst({
    where: { tenantId, id, status: "ACTIVE" },
    include: catalogDetailProductInclude,
  });
  return row ? toPublicProduct(row) : null;
}

export const listPublicCategories = cache(async (): Promise<string[]> => {
  const tenantId = await resolvePublicTenantId();
  const rows = await prisma.category.findMany({
    where: { tenantId, active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { name: true },
  });
  return rows.map((r) => r.name);
});

export const listPublicSkinTypes = cache(async (): Promise<string[]> => {
  const tenantId = await resolvePublicTenantId();
  const rows = await prisma.skinType.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
    select: { name: true },
  });
  return rows.map((r) => r.name);
});

export const listPublicConcerns = cache(async (): Promise<string[]> => {
  const tenantId = await resolvePublicTenantId();
  const rows = await prisma.skinConcern.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
    select: { name: true },
  });
  return rows.map((r) => r.name);
});

export async function getRelatedPublicProducts(slug: string, limit = 3): Promise<Product[]> {
  const tenantId = await resolvePublicTenantId();
  const source = await prisma.product.findFirst({
    where: { tenantId, slug, status: "ACTIVE" },
    select: { id: true, categoryId: true, concerns: { select: { concernId: true } } },
  });
  if (!source) return [];

  const concernIds = source.concerns.map((c) => c.concernId);
  const rows = await prisma.product.findMany({
    where: {
      tenantId,
      status: "ACTIVE",
      NOT: { id: source.id },
      OR: [
        ...(source.categoryId ? [{ categoryId: source.categoryId }] : []),
        ...(concernIds.length ? [{ concerns: { some: { concernId: { in: concernIds } } } }] : []),
      ],
    },
    select: catalogListProductSelect,
    take: limit,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(toPublicProduct);
}

export async function getCompleteRoutinePublicProducts(slug: string): Promise<Product[]> {
  const tenantId = await resolvePublicTenantId();
  const source = await prisma.product.findFirst({
    where: { tenantId, slug, status: "ACTIVE" },
    select: { id: true, routineStep: true },
  });

  const rows = await prisma.product.findMany({
    where: {
      tenantId,
      status: "ACTIVE",
      routineStep: { in: [...ROUTINE_STEPS] },
      ...(source?.id ? { NOT: { id: source.id } } : {}),
    },
    select: catalogListProductSelect,
    orderBy: [{ featured: "desc" }, { routineStep: "asc" }],
    take: 8,
  });

  const mapped = rows.map(toPublicProduct);
  if (!source?.routineStep) return mapped.slice(0, 4);
  return mapped.slice(0, 3);
}

export async function listActiveProductSlugs(): Promise<{ slug: string }[]> {
  const tenantId = await resolvePublicTenantId();
  return prisma.product.findMany({
    where: { tenantId, status: "ACTIVE" },
    select: { slug: true },
    orderBy: { slug: "asc" },
  });
}
