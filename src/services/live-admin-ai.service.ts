import { requireRequestContext } from "@/lib/auth/request-context";
import { authorize } from "@/lib/auth/authorize-context";
import { prisma } from "@/lib/db/prisma";
import { tenantScopeWhere } from "@/lib/db/tenant-query";
import { getAiLimits } from "@/modules/ai/config/ai-limits";
import type { AiAdminOverview } from "@/types/admin";

export async function getLiveAiOverview(): Promise<AiAdminOverview> {
  const ctx = await requireRequestContext();
  authorize(ctx, "conversations.read");
  const tenantId = ctx.tenantId!;

  const [conversationCount, handoffCount, recommendationCount] = await Promise.all([
    prisma.conversation.count({
      where: { ...tenantScopeWhere(tenantId, ctx.role), channel: "AI_ASSISTANT" },
    }),
    prisma.conversation.count({
      where: {
        ...tenantScopeWhere(tenantId, ctx.role),
        channel: "AI_ASSISTANT",
        status: { in: ["HANDOFF_REQUESTED", "HUMAN_ASSIGNED"] },
      },
    }),
    prisma.customerRecommendation.count({
      where: { ...tenantScopeWhere(tenantId, ctx.role) },
    }),
  ]);

  const limits = getAiLimits();

  return {
    conversationCount,
    recommendationCount,
    handoffCount,
    failedCount: 0,
    recommendationPerformance: [],
    recentConversations: [],
    toolActivity: [],
    config: {
      modelLabel: limits.hasProviderKey ? limits.model : "Deterministic orchestrator (no API key)",
      handoffEnabled: true,
      catalogSearchEnabled: true,
      orderLookupEnabled: true,
    },
    failedInteractions: [],
  };
}
