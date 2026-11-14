import type { Product } from "@/types/commerce";
import type { AssistantProductRef } from "@/types/assistant";

export function toAssistantProductRef(product: Product, reason?: string): AssistantProductRef {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    image: product.image,
    displayPrice: product.price,
    category: product.category,
    concern: product.concern,
    ...(reason ? { reason } : {}),
  };
}

export function toPublicProductSummary(product: Product) {
  return {
    slug: product.slug,
    name: product.name,
    price: product.price,
    currency: "NGN" as const,
    category: product.category,
    concern: product.concern,
    skinTypes: product.skinTypes,
    ingredients: product.ingredients.slice(0, 12),
    inStock: product.stock > 0,
    usageInstructions: product.usageInstructions,
    warnings: product.warnings,
    image: product.image,
  };
}
