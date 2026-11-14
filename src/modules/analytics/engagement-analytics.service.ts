import { prisma } from "@/lib/db/prisma";
import { safeRate } from "@/modules/analytics/analytics-filters";
import type { ResolvedAnalyticsRange } from "@/modules/analytics/analytics-filters";
import type { ProductPerformanceRow } from "@/modules/analytics/product-analytics.service";

export type ProductEngagementRow = {
  productId: string | null;
  name: string;
  views: number;
  addToCart: number;
  purchases: number;
  conversionRate: number;
};

export type AttributionMetrics = {
  recommendationClicks: number;
  assistantAddToCart: number;
  assistedOrders: number;
};

export async function getAttributionMetrics(
  tenantId: string,
  range: ResolvedAnalyticsRange,
): Promise<AttributionMetrics> {
  const where = {
    tenantId,
    createdAt: { gte: range.start, lt: range.end },
  };

  const [recommendationClicks, assistantAddToCart, assistedOrders] = await Promise.all([
    prisma.analyticsEvent.count({
      where: { ...where, eventType: "ASSISTANT_RECOMMENDATION_CLICK" },
    }),
    prisma.analyticsEvent.count({
      where: { ...where, eventType: "ASSISTANT_ADD_TO_CART" },
    }),
    prisma.analyticsEvent.count({
      where: { ...where, eventType: "ASSISTANT_ORDER_ATTRIBUTED" },
    }),
  ]);

  return { recommendationClicks, assistantAddToCart, assistedOrders };
}

export async function buildProductEngagementRows(
  tenantId: string,
  range: ResolvedAnalyticsRange,
  purchases: ProductPerformanceRow[],
): Promise<ProductEngagementRow[]> {
  const events = await prisma.analyticsEvent.groupBy({
    by: ["productId", "eventType"],
    where: {
      tenantId,
      createdAt: { gte: range.start, lt: range.end },
      productId: { not: null },
    },
    _count: { _all: true },
  });

  const productIds = new Set<string>();
  for (const p of purchases) {
    if (p.productId) productIds.add(p.productId);
  }
  for (const e of events) {
    if (e.productId) productIds.add(e.productId);
  }

  const products =
    productIds.size > 0
      ? await prisma.product.findMany({
          where: { tenantId, id: { in: [...productIds] } },
          select: { id: true, name: true },
        })
      : [];
  const nameById = new Map(products.map((p) => [p.id, p.name]));

  const stats = new Map<string, { views: number; addToCart: number; purchases: number }>();

  for (const p of purchases) {
    const key = p.productId ?? p.name;
    const row = stats.get(key) ?? { views: 0, addToCart: 0, purchases: 0 };
    row.purchases += p.units;
    stats.set(key, row);
  }

  for (const e of events) {
    if (!e.productId) continue;
    const key = e.productId;
    const row = stats.get(key) ?? { views: 0, addToCart: 0, purchases: 0 };
    if (e.eventType === "PRODUCT_VIEW") row.views += e._count._all;
    if (e.eventType === "STOREFRONT_ADD_TO_CART" || e.eventType === "ASSISTANT_ADD_TO_CART") {
      row.addToCart += e._count._all;
    }
    stats.set(key, row);
  }

  return [...stats.entries()]
    .map(([key, s]) => {
      const name = nameById.get(key) ?? purchases.find((p) => p.productId === key)?.name ?? key;
      return {
        productId: nameById.has(key) ? key : null,
        name,
        views: s.views,
        addToCart: s.addToCart,
        purchases: s.purchases,
        conversionRate: safeRate(s.purchases, s.views),
      };
    })
    .sort((a, b) => b.purchases - a.purchases || b.views - a.views)
    .slice(0, 25);
}
