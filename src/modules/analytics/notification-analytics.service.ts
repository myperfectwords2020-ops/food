import { prisma } from "@/lib/db/prisma";
import type { ResolvedAnalyticsRange } from "@/modules/analytics/analytics-filters";
import { safeRate } from "@/modules/analytics/analytics-filters";

export type NotificationAnalyticsMetrics = {
  queued: number;
  sent: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
  failureRate: number;
  byChannel: { channel: string; sent: number; failed: number }[];
  byType: { type: string; count: number }[];
};

export async function getNotificationAnalytics(
  tenantId: string,
  range: ResolvedAnalyticsRange,
): Promise<NotificationAnalyticsMetrics> {
  const where = {
    tenantId,
    createdAt: { gte: range.start, lt: range.end },
    channel: { not: "IN_APP" as const },
  };

  const [queued, sent, delivered, failed, channelGroups, typeGroups] = await Promise.all([
    prisma.notification.count({
      where: { ...where, status: { in: ["QUEUED", "PROCESSING"] } },
    }),
    prisma.notification.count({
      where: { ...where, status: "SENT" },
    }),
    prisma.notification.count({
      where: { ...where, status: "DELIVERED" },
    }),
    prisma.notification.count({
      where: { ...where, status: "FAILED" },
    }),
    prisma.notification.groupBy({
      by: ["channel", "status"],
      where,
      _count: { _all: true },
    }),
    prisma.notification.groupBy({
      by: ["type"],
      where,
      _count: { _all: true },
    }),
  ]);

  const channelMap = new Map<string, { sent: number; failed: number }>();
  for (const row of channelGroups) {
    const bucket = channelMap.get(row.channel) ?? { sent: 0, failed: 0 };
    if (row.status === "SENT" || row.status === "DELIVERED") {
      bucket.sent += row._count._all;
    }
    if (row.status === "FAILED") bucket.failed += row._count._all;
    channelMap.set(row.channel, bucket);
  }

  const attempted = sent + delivered + failed;
  return {
    queued,
    sent,
    delivered,
    failed,
    deliveryRate: safeRate(sent + delivered, attempted),
    failureRate: safeRate(failed, attempted),
    byChannel: [...channelMap.entries()].map(([channel, v]) => ({
      channel,
      sent: v.sent,
      failed: v.failed,
    })),
    byType: typeGroups
      .map((g) => ({ type: g.type, count: g._count._all }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15),
  };
}
