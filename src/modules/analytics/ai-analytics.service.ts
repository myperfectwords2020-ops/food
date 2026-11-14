import { prisma } from "@/lib/db/prisma";
import type { ResolvedAnalyticsRange } from "@/modules/analytics/analytics-filters";

export type AIAnalyticsMetrics = {
  conversationsStarted: number;
  customerMessages: number;
  aiResponses: number;
  handoffRequests: number;
  handoffRate: number;
  resolvedConversations: number;
  recommendations: number;
};

export async function getAIAnalytics(
  tenantId: string,
  range: ResolvedAnalyticsRange,
): Promise<AIAnalyticsMetrics> {
  const convoWhere = {
    tenantId,
    channel: "AI_ASSISTANT" as const,
    createdAt: { gte: range.start, lt: range.end },
  };

  const [
    conversationsStarted,
    handoffRequests,
    resolvedConversations,
    recommendations,
    customerMessages,
    aiResponses,
  ] = await Promise.all([
    prisma.conversation.count({ where: convoWhere }),
    prisma.conversation.count({
      where: {
        ...convoWhere,
        handoffRequestedAt: { not: null },
      },
    }),
    prisma.conversation.count({
      where: {
        tenantId,
        channel: "AI_ASSISTANT",
        resolvedAt: { gte: range.start, lt: range.end },
      },
    }),
    prisma.customerRecommendation.count({
      where: { tenantId, createdAt: { gte: range.start, lt: range.end } },
    }),
    prisma.message.count({
      where: {
        tenantId,
        role: "CUSTOMER",
        createdAt: { gte: range.start, lt: range.end },
        conversation: { channel: "AI_ASSISTANT" },
      },
    }),
    prisma.message.count({
      where: {
        tenantId,
        role: "AI",
        createdAt: { gte: range.start, lt: range.end },
        conversation: { channel: "AI_ASSISTANT" },
      },
    }),
  ]);

  const handoffRate =
    conversationsStarted > 0
      ? Math.round((handoffRequests / conversationsStarted) * 1000) / 10
      : 0;

  return {
    conversationsStarted,
    customerMessages,
    aiResponses,
    handoffRequests,
    handoffRate,
    resolvedConversations,
    recommendations,
  };
}
