import { fromMinorUnits } from "@/lib/money";
import { sellableStock } from "@/modules/catalog/product.mapper";
import {
  MAX_QUANTITY_PER_LINE,
  STANDARD_DELIVERY_MINOR,
} from "@/modules/commerce/commerce.constants";
import type { CartSummary } from "@/types/commerce";

export type PricedLine = {
  productId: string;
  name: string;
  slug: string;
  sku: string | null;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
  image: string;
  maxQuantity: number;
};

export type PriceBreakdown = {
  currency: "NGN";
  lines: PricedLine[];
  subtotalMinor: number;
  discountMinor: number;
  deliveryMinor: number;
  taxMinor: number;
  totalMinor: number;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  sku: string | null;
  status: string;
  priceMinor: number;
  currency: string;
  stock: number;
  reservedStock: number;
  images: { url: string }[];
};

export type PricingIssue =
  | { code: "PRODUCT_UNAVAILABLE"; productId: string }
  | { code: "OUT_OF_STOCK"; productId: string }
  | { code: "QUANTITY_REDUCED"; productId: string; requested: number; allowed: number };

export function priceCartLines(
  items: { productId: string; quantity: number }[],
  products: Map<string, ProductRow>,
  options?: { includeDelivery?: boolean; deliveryMinor?: number },
): { breakdown: PriceBreakdown; issues: PricingIssue[] } {
  const issues: PricingIssue[] = [];
  const lines: PricedLine[] = [];

  for (const item of items) {
    if (item.quantity <= 0) continue;
    const product = products.get(item.productId);
    if (!product || product.status !== "ACTIVE") {
      issues.push({ code: "PRODUCT_UNAVAILABLE", productId: item.productId });
      continue;
    }

    const available = sellableStock(product);
    if (available <= 0) {
      issues.push({ code: "OUT_OF_STOCK", productId: item.productId });
      continue;
    }

    const cappedRequest = Math.min(item.quantity, MAX_QUANTITY_PER_LINE);
    let quantity = cappedRequest;
    if (quantity > available) {
      issues.push({
        code: "QUANTITY_REDUCED",
        productId: item.productId,
        requested: item.quantity,
        allowed: available,
      });
      quantity = available;
    }

    const unitPriceMinor = product.priceMinor;
    lines.push({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      quantity,
      unitPriceMinor,
      lineTotalMinor: unitPriceMinor * quantity,
      image: product.images[0]?.url ?? "",
      maxQuantity: available,
    });
  }

  const subtotalMinor = lines.reduce((s, l) => s + l.lineTotalMinor, 0);
  const discountMinor = 0;
  const taxMinor = 0;
  const deliveryMinor =
    options?.includeDelivery && subtotalMinor > 0
      ? (options.deliveryMinor ?? STANDARD_DELIVERY_MINOR)
      : 0;
  const totalMinor = subtotalMinor + deliveryMinor + taxMinor - discountMinor;

  return {
    breakdown: {
      currency: "NGN",
      lines,
      subtotalMinor,
      discountMinor,
      deliveryMinor,
      taxMinor,
      totalMinor,
    },
    issues,
  };
}

export function breakdownToCartSummary(breakdown: PriceBreakdown): CartSummary {
  return {
    lines: breakdown.lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
      name: l.name,
      slug: l.slug,
      image: l.image,
      unitPrice: fromMinorUnits(l.unitPriceMinor, breakdown.currency),
      lineTotal: fromMinorUnits(l.lineTotalMinor, breakdown.currency),
      maxQuantity: l.maxQuantity,
    })),
    subtotal: fromMinorUnits(breakdown.subtotalMinor, breakdown.currency),
    delivery: breakdown.deliveryMinor
      ? fromMinorUnits(breakdown.deliveryMinor, breakdown.currency)
      : null,
    discount: fromMinorUnits(breakdown.discountMinor, breakdown.currency),
    total: fromMinorUnits(breakdown.totalMinor, breakdown.currency),
    currency: breakdown.currency,
  };
}
