import type { AssistantMessageContent } from "@/types/assistant";
import type { AiToolContext } from "@/modules/ai/types/tool-context";
import { getAiLimits } from "@/modules/ai/config/ai-limits";
import { isPromptInjection, isUrgentMedicalConcern } from "@/modules/ai/safety/injection-guard";
import {
  HANDOFF_MESSAGE,
  INJECTION_REFUSAL,
  MEDICAL_ESCALATION_MESSAGE,
} from "@/modules/ai/prompts/safety";
import { runHeuristicTurn } from "@/modules/ai/orchestrator/heuristic-orchestrator";
import { runOpenAiTurn } from "@/modules/ai/providers/openai-orchestrator";
import {
  conversationBlocksAiResponses,
  getConversationForTenant,
  requestHumanHandoff,
} from "@/modules/conversations/conversation.service";
import { logger } from "@/lib/logger/logger";

export async function runAssistantOrchestrator(input: {
  userMessage: string;
  ctx: AiToolContext;
}): Promise<{ content: AssistantMessageContent; handoff?: boolean }> {
  const limits = getAiLimits();
  const trimmed = input.userMessage.trim();

  const conversation = await getConversationForTenant(input.ctx.tenantId, input.ctx.conversationId);
  if (conversationBlocksAiResponses(conversation.status)) {
    return {
      content: {
        type: "text",
        text: "A team member is handling this conversation. They will reply here shortly.",
      },
    };
  }
  if (!trimmed) {
    return { content: { type: "text", text: "Please enter a message to continue." } };
  }

  if (isPromptInjection(trimmed)) {
    return { content: { type: "text", text: INJECTION_REFUSAL } };
  }

  if (isUrgentMedicalConcern(trimmed)) {
    await requestHumanHandoff({
      tenantId: input.ctx.tenantId,
      conversationId: input.ctx.conversationId,
      customerId: input.ctx.customerId ?? null,
      reason: "Medical urgency detected",
    });
    return { content: { type: "text", text: MEDICAL_ESCALATION_MESSAGE }, handoff: true };
  }

  if (/speak to (a )?human|real person|agent|support team/i.test(trimmed)) {
    await requestHumanHandoff({
      tenantId: input.ctx.tenantId,
      conversationId: input.ctx.conversationId,
      customerId: input.ctx.customerId ?? null,
      reason: "Customer requested human",
    });
    return { content: { type: "text", text: HANDOFF_MESSAGE }, handoff: true };
  }

  const started = Date.now();
  try {
    const content = limits.hasProviderKey
      ? await runOpenAiTurn(trimmed, input.ctx)
      : await runHeuristicTurn(trimmed, input.ctx);

    logger.info("ai_turn_complete", {
      tenantId: input.ctx.tenantId,
      operation: limits.hasProviderKey ? "openai" : "heuristic",
      durationMs: Date.now() - started,
    });
    return { content };
  } catch (err) {
    logger.error(
      "ai_turn_failed",
      { tenantId: input.ctx.tenantId, operation: "orchestrator" },
      {
        error: err instanceof Error ? err.message : "unknown",
      },
    );
    return {
      content: {
        type: "text",
        text: "I'm having trouble responding right now. Please try again in a moment.",
      },
    };
  }
}
