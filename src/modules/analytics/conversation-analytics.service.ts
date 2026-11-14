import { prisma } from "@/lib/db/prisma";
import type { ResolvedAnalyticsRange } from "@/modules/analytics/analytics-filters";

export type ConversationAnalyticsMetrics = {
  byStatus: { status: string; count: number }[];
  humanAssigned: number;
  unresolvedBacklog: number;
};

export async function getConversationAnalytics(
  tenantId: string,
  range: ResolvedAnalyticsRange,
): Promise<ConversationAnalyticsMetrics> {
  const [statusGroups, humanAssigned, unresolvedBacklog] = await Promise.all([
    prisma.conversation.groupBy({
      by: ["status"],
      where: {
        tenantId,
        createdAt: { gte: range.start, lt: range.end },
      },
      _count: { _all: true },
    }),
    prisma.conversation.count({
      where: {
        tenantId,
        assignedToUserId: { not: null },
        assignedAt: { gte: range.start, lt: range.end },
      },
    }),
    prisma.conversation.count({
      where: {
        tenantId,
        status: { in: ["ACTIVE", "HANDOFF_REQUESTED", "HUMAN_ASSIGNED"] },
      },
    }),
  ]);

  return {
    byStatus: statusGroups.map((g) => ({ status: g.status, count: g._count._all })),
    humanAssigned,
    unresolvedBacklog,
  };
}
