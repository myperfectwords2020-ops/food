import { prisma } from "@/lib/db/prisma";
import type { ResolvedAnalyticsRange } from "@/modules/analytics/analytics-filters";
import { safeRate } from "@/modules/analytics/analytics-filters";

export type OrderAnalyticsMetrics = {
  ordersByStatus: { status: string; count: number }[];
  paymentSuccessRate: number;
  cancellationRate: number;
};

export async function getOrderAnalytics(
  tenantId: string,
  range: ResolvedAnalyticsRange,
): Promise<OrderAnalyticsMetrics> {
  const orderWhere = {
    tenantId,
    createdAt: { gte: range.start, lt: range.end },
  };

  const [statusGroups, ordersInRange, succeededPayments, cancelledInRange] = await Promise.all([
    prisma.order.groupBy({
      by: ["status"],
      where: orderWhere,
      _count: { _all: true },
    }),
    prisma.order.count({ where: orderWhere }),
    prisma.payment.count({
      where: {
        tenantId,
        status: "SUCCEEDED",
        paidAt: { gte: range.start, lt: range.end },
      },
    }),
    prisma.order.count({
      where: { ...orderWhere, status: "CANCELLED" },
    }),
  ]);

  const paymentAttempts = await prisma.payment.count({
    where: {
      tenantId,
      createdAt: { gte: range.start, lt: range.end },
    },
  });

  return {
    ordersByStatus: statusGroups.map((g) => ({
      status: g.status,
      count: g._count._all,
    })),
    paymentSuccessRate: safeRate(succeededPayments, paymentAttempts),
    cancellationRate: safeRate(cancelledInRange, ordersInRange),
  };
}
