import { fromMinorUnits } from "@/lib/money";
import type { Product } from "@/types/commerce";

import { DEFAULT_CATALOG_IMAGE } from "@/config/catalog-images";
import { shadeOptionsForProduct } from "@/config/product-shades";

const PLACEHOLDER_IMAGE = DEFAULT_CATALOG_IMAGE;

export function sellableStock(record: { stock: number; reservedStock: number }): number {
  return Math.max(0, record.stock - record.reservedStock);
}

export type PublicProductSource = {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string | null;
  description?: string | null;
  priceMinor: number;
  currency: string;
  stock: number;
  reservedStock: number;
  badge?: string | null;
  usageInstructions?: string | null;
  warnings?: string | null;
  createdAt: Date | string;
  category?: { name: string } | null;
  images: { url: string }[];
  concerns: { concern: { name: string } }[];
  skinTypes: { skinType: { name: string } }[];
  ingredients?: { ingredient: { name: string } }[];
};

export function toPublicProduct(record: PublicProductSource): Product {
  const primaryImage = record.images[0]?.url ?? PLACEHOLDER_IMAGE;
  const concern = record.concerns[0]?.concern.name ?? "Everyday cooking";
  const skinTypes = record.skinTypes.map((s) => s.skinType.name);

  const createdAt =
    record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt;

  const product: Product = {
    id: record.id,
    slug: record.slug,
    name: record.name,
    category: record.category?.name ?? "Groceries",
    description: record.shortDescription ?? record.description ?? "",
    price: fromMinorUnits(record.priceMinor, record.currency),
    image: primaryImage,
    concern,
    skinTypes,
    ingredients: (record.ingredients ?? []).map((i) => i.ingredient.name),
    stock: sellableStock(record),
    createdAt,
  };

  if (record.usageInstructions) product.usageInstructions = record.usageInstructions;
  if (record.warnings) product.warnings = record.warnings;
  if (record.badge) product.badge = record.badge;

  const shadeOptions = shadeOptionsForProduct(record.slug);
  if (shadeOptions) product.shadeOptions = shadeOptions;

  return product;
}
