import type { Prisma } from "@prisma/client";

/** Shop/search cards: one image, no ingredients, no long description blob. */
export const catalogListProductSelect = {
  id: true,
  slug: true,
  name: true,
  shortDescription: true,
  priceMinor: true,
  currency: true,
  stock: true,
  reservedStock: true,
  badge: true,
  createdAt: true,
  category: { select: { name: true } },
  images: { orderBy: { sortOrder: "asc" as const }, take: 1, select: { url: true } },
  skinTypes: {
    take: 3,
    select: { skinType: { select: { name: true } } },
  },
  concerns: {
    take: 1,
    select: { concern: { select: { name: true } } },
  },
} satisfies Prisma.ProductSelect;

export type CatalogListProductRecord = Prisma.ProductGetPayload<{
  select: typeof catalogListProductSelect;
}>;

/** PDP: bounded images + taxonomy. Avoid unbounded image arrays. */
export const catalogDetailProductInclude = {
  category: { select: { name: true } },
  images: { orderBy: { sortOrder: "asc" as const }, take: 12 },
  ingredients: { include: { ingredient: { select: { name: true } } } },
  skinTypes: { include: { skinType: { select: { name: true } } } },
  concerns: { include: { concern: { select: { name: true } } } },
} satisfies Prisma.ProductInclude;

export type CatalogDetailProductRecord = Prisma.ProductGetPayload<{
  include: typeof catalogDetailProductInclude;
}>;

/** Admin editors still need storage keys and full image lists. */
export const catalogProductInclude = {
  category: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  ingredients: { include: { ingredient: true } },
  skinTypes: { include: { skinType: true } },
  concerns: { include: { concern: true } },
} satisfies Prisma.ProductInclude;

export type CatalogProductRecord = Prisma.ProductGetPayload<{
  include: typeof catalogProductInclude;
}>;

/** Pricing/checkout: price, stock, and one image only. */
export const productPricingSelect = {
  id: true,
  slug: true,
  name: true,
  sku: true,
  status: true,
  priceMinor: true,
  currency: true,
  stock: true,
  reservedStock: true,
  images: { orderBy: { sortOrder: "asc" as const }, take: 1, select: { url: true } },
} satisfies Prisma.ProductSelect;
