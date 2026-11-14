import { prisma } from "@/lib/db/prisma";
import type { ResolvedAnalyticsRange } from "@/modules/analytics/analytics-filters";

export type CustomerAnalyticsMetrics = {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  repeatPurchases: number;
  lifecycleDistribution: { stage: string; count: number }[];
};

export async function getCustomerAnalytics(
  tenantId: string,
  range: ResolvedAnalyticsRange,
): Promise<CustomerAnalyticsMetrics> {
  const [totalCustomers, newCustomers, lifecycleGroups, repeatOrderGroups] = await Promise.all([
    prisma.customer.count({ where: { tenantId } }),
    prisma.customer.count({
      where: { tenantId, createdAt: { gte: range.start, lt: range.end } },
    }),
    prisma.customer.groupBy({
      by: ["lifecycle"],
      where: { tenantId },
      _count: { _all: true },
    }),
    prisma.order.groupBy({
      by: ["customerId"],
      where: {
        tenantId,
        customerId: { not: null },
        status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
      },
      _count: { _all: true },
    }),
  ]);

  let returningCustomers = 0;
  let repeatPurchases = 0;
  for (const row of repeatOrderGroups) {
    if (!row.customerId) continue;
    if (row._count._all >= 2) {
      returningCustomers += 1;
      repeatPurchases += row._count._all - 1;
    }
  }

  return {
    totalCustomers,
    newCustomers,
    returningCustomers,
    repeatPurchases,
    lifecycleDistribution: lifecycleGroups.map((g) => ({
      stage: g.lifecycle,
      count: g._count._all,
    })),
  };
}
