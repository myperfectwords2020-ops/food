import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { toMinorUnits } from "@/lib/money";
import { slugify } from "@/lib/slug";
import type { ProductFilters } from "@/types/commerce";

export function normalizeCatalogQuery(q?: string) {
  return q?.trim().slice(0, 120) ?? "";
}

/** Indexed name/sku/slug and category-name search only — never ILIKE the description TEXT column. */
export function catalogTextSearchWhere(q: string): Prisma.ProductWhereInput {
  return {
    OR: [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { category: { name: { contains: q, mode: "insensitive" } } },
    ],
  };
}

export async function buildPublicProductWhere(
  tenantId: string,
  filters: ProductFilters,
): Promise<Prisma.ProductWhereInput> {
  const and: Prisma.ProductWhereInput[] = [{ tenantId, status: "ACTIVE" }];

  const q = normalizeCatalogQuery(filters.q);
  if (q) {
    and.push(catalogTextSearchWhere(q));
  }

  if (filters.category && filters.category !== "All") {
    const category = await prisma.category.findFirst({
      where: {
        tenantId,
        active: true,
        OR: [
          { name: { equals: filters.category, mode: "insensitive" } },
          { slug: slugify(filters.category) },
        ],
      },
      select: { id: true },
    });
    and.push(category ? { categoryId: category.id } : { id: "__none__" });
  }

  if (filters.skinType) {
    const skin = filters.skinType.toLowerCase();
    const row = await prisma.skinType.findFirst({
      where: {
        tenantId,
        OR: [
          { slug: skin },
          { slug: slugify(filters.skinType) },
          { name: { equals: filters.skinType, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });
    and.push(row ? { skinTypes: { some: { skinTypeId: row.id } } } : { id: "__none__" });
  }

  if (filters.concern) {
    const row = await prisma.skinConcern.findFirst({
      where: {
        tenantId,
        OR: [
          { slug: slugify(filters.concern) },
          { name: { equals: filters.concern, mode: "insensitive" } },
          { name: { contains: filters.concern, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });
    and.push(row ? { concerns: { some: { concernId: row.id } } } : { id: "__none__" });
  }

  if (filters.minPrice != null) {
    and.push({ priceMinor: { gte: toMinorUnits(filters.minPrice) } });
  }
  if (filters.maxPrice != null) {
    and.push({ priceMinor: { lte: toMinorUnits(filters.maxPrice) } });
  }

  return { AND: and };
}
