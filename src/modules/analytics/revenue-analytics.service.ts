import { prisma } from "@/lib/db/prisma";
import { fromMinorUnits } from "@/lib/money";
import type { ResolvedAnalyticsRange } from "@/modules/analytics/analytics-filters";

export type RefundMetrics = {
  refundCount: number;
  refundTotalByCurrency: Record<string, number>;
  /** NGN refunds in major units */
  refundTotalNgn: number;
  /** paid NGN minus refunded NGN in range (same currency only) */
  netRevenueNgn: number;
};

export type RevenueMetrics = {
  /** Verified succeeded payment totals in major units, by currency */
  paidRevenueByCurrency: Record<string, number>;
  /** Primary currency total (NGN) in major units for dashboard display */
  paidRevenue: number;
  paidOrderCount: number;
  averageOrderValue: number;
  failedPaymentCount: number;
  cancelledOrderCount: number;
  revenueTrend: { label: string; value: number; orders: number }[];
  refunds: RefundMetrics;
};

type PaymentRow = {
  orderId: string;
  amountMinor: number;
  currency: string;
  paidAt: Date | null;
};

/** One succeeded payment amount per order (latest by paidAt) to avoid double counting. */
export function dedupeSucceededPayments(rows: PaymentRow[]): PaymentRow[] {
  const byOrder = new Map<string, PaymentRow>();
  for (const row of rows) {
    if (!row.paidAt) continue;
    const existing = byOrder.get(row.orderId);
    if (!existing || (existing.paidAt && row.paidAt > existing.paidAt)) {
      byOrder.set(row.orderId, row);
    }
  }
  return [...byOrder.values()];
}

export function sumPaidRevenueByCurrency(rows: PaymentRow[]): Record<string, number> {
  const deduped = dedupeSucceededPayments(rows);
  const totals: Record<string, number> = {};
  for (const row of deduped) {
    totals[row.currency] =
      (totals[row.currency] ?? 0) + fromMinorUnits(row.amountMinor, row.currency);
  }
  return totals;
}

export async function getRevenueMetrics(
  tenantId: string,
  range: ResolvedAnalyticsRange,
): Promise<RevenueMetrics> {
  const paymentWhere = {
    tenantId,
    status: "SUCCEEDED" as const,
    paidAt: { gte: range.start, lt: range.end },
  };

  const [succeededRows, failedPayments, cancelledOrders, refundRows] = await Promise.all([
    prisma.payment.findMany({
      where: paymentWhere,
      select: { orderId: true, amountMinor: true, currency: true, paidAt: true },
    }),
    prisma.payment.count({
      where: {
        tenantId,
        status: "FAILED",
        createdAt: { gte: range.start, lt: range.end },
      },
    }),
    prisma.order.count({
      where: {
        tenantId,
        status: "CANCELLED",
        createdAt: { gte: range.start, lt: range.end },
      },
    }),
    prisma.payment.findMany({
      where: {
        tenantId,
        status: "REFUNDED",
        updatedAt: { gte: range.start, lt: range.end },
      },
      select: { orderId: true, amountMinor: true, currency: true, paidAt: true },
    }),
  ]);

  const deduped = dedupeSucceededPayments(succeededRows);
  const paidRevenueByCurrency = sumPaidRevenueByCurrency(deduped);
  const paidRevenue = paidRevenueByCurrency["NGN"] ?? 0;
  const paidOrderCount = deduped.length;
  const averageOrderValue =
    paidOrderCount > 0 ? Math.round((paidRevenue / paidOrderCount) * 100) / 100 : 0;

  const trendMap = new Map<string, { revenueMinor: number; orders: Set<string> }>();
  for (const row of deduped) {
    if (!row.paidAt) continue;
    const key = row.paidAt.toISOString().slice(0, 10);
    const bucket = trendMap.get(key) ?? { revenueMinor: 0, orders: new Set<string>() };
    bucket.revenueMinor += row.amountMinor;
    bucket.orders.add(row.orderId);
    trendMap.set(key, bucket);
  }

  const revenueTrend = [...trendMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, bucket]) => ({
      label,
      value: fromMinorUnits(bucket.revenueMinor, "NGN"),
      orders: bucket.orders.size,
    }));

  const refundByOrder = new Map<string, PaymentRow>();
  for (const r of refundRows) {
    refundByOrder.set(r.orderId, {
      orderId: r.orderId,
      amountMinor: r.amountMinor,
      currency: r.currency,
      paidAt: r.paidAt,
    });
  }
  const dedupedRefunds = [...refundByOrder.values()];
  const refundTotalByCurrency = sumPaidRevenueByCurrency(dedupedRefunds);
  const refundTotalNgn = refundTotalByCurrency["NGN"] ?? 0;
  const netRevenueNgn = Math.max(0, Math.round((paidRevenue - refundTotalNgn) * 100) / 100);

  return {
    paidRevenueByCurrency,
    paidRevenue,
    paidOrderCount,
    averageOrderValue,
    failedPaymentCount: failedPayments,
    cancelledOrderCount: cancelledOrders,
    revenueTrend,
    refunds: {
      refundCount: dedupedRefunds.length,
      refundTotalByCurrency,
      refundTotalNgn,
      netRevenueNgn,
    },
  };
}

export async function getRevenueMetricsForWindow(
  tenantId: string,
  start: Date,
  end: Date,
): Promise<{ paidRevenue: number; paidOrderCount: number }> {
  const rows = await prisma.payment.findMany({
    where: {
      tenantId,
      status: "SUCCEEDED",
      paidAt: { gte: start, lt: end },
    },
    select: { orderId: true, amountMinor: true, currency: true, paidAt: true },
  });
  const deduped = dedupeSucceededPayments(rows);
  const byCurrency = sumPaidRevenueByCurrency(deduped);
  return {
    paidRevenue: byCurrency["NGN"] ?? 0,
    paidOrderCount: deduped.length,
  };
}
