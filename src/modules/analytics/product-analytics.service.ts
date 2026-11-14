import { prisma } from "@/lib/db/prisma";
import { fromMinorUnits } from "@/lib/money";
import type { ResolvedAnalyticsRange } from "@/modules/analytics/analytics-filters";

export type ProductPerformanceRow = {
  productId: string | null;
  name: string;
  units: number;
  revenue: number;
};

export type ProductAnalyticsMetrics = {
  topProducts: ProductPerformanceRow[];
  lowStockCount: number;
  outOfStockCount: number;
};

function paidOrdersInRange(tenantId: string, range: ResolvedAnalyticsRange) {
  return {
    tenantId,
    payments: {
      some: {
        status: "SUCCEEDED" as const,
        paidAt: { gte: range.start, lt: range.end },
      },
    },
    status: { notIn: ["CANCELLED" as const, "FAILED" as const] },
  };
}

export async function getProductAnalytics(
  tenantId: string,
  range: ResolvedAnalyticsRange,
): Promise<ProductAnalyticsMetrics> {
  const orderFilter = paidOrdersInRange(tenantId, range);

  const [lineItems, inventoryRows] = await Promise.all([
    prisma.orderItem.findMany({
      where: { tenantId, order: orderFilter },
      select: {
        productId: true,
        productName: true,
        quantity: true,
        lineTotalMinor: true,
      },
    }),
    prisma.product.findMany({
      where: { tenantId, status: "ACTIVE" },
      select: { stock: true, lowStockThreshold: true },
    }),
  ]);

  const byKey = new Map<string, ProductPerformanceRow>();
  for (const line of lineItems) {
    const key = line.productId ?? line.productName;
    const existing = byKey.get(key) ?? {
      productId: line.productId,
      name: line.productName,
      units: 0,
      revenue: 0,
    };
    existing.units += line.quantity;
    existing.revenue += fromMinorUnits(line.lineTotalMinor, "NGN");
    byKey.set(key, existing);
  }

  const topProducts = [...byKey.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 20);

  let lowStockCount = 0;
  let outOfStockCount = 0;
  for (const p of inventoryRows) {
    if (p.stock <= 0) outOfStockCount += 1;
    else if (p.stock <= p.lowStockThreshold) lowStockCount += 1;
  }

  return { topProducts, lowStockCount, outOfStockCount };
}
