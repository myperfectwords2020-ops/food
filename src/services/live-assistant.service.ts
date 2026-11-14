import { getRequestContext } from "@/lib/auth/request-context";
import { resolvePublicTenantId } from "@/lib/tenants/public-tenant";
import { rateLimit } from "@/lib/security/rate-limit";
import { getAiLimits } from "@/modules/ai/config/ai-limits";
import {
  appendConversationMessage,
  assertConversationAccess,
  ASSISTANT_QUICK_ACTIONS,
  ASSISTANT_SUGGESTED_PROMPTS,
  buildWelcomeMessage,
  createAssistantConversation,
} from "@/modules/ai/conversations/assistant-conversation.service";
import { runAssistantOrchestrator } from "@/modules/ai/orchestrator/assistant-orchestrator";
import type { AiToolContext } from "@/modules/ai/types/tool-context";
import {
  assertCustomerConversationAccess,
  conversationBlocksAiResponses,
  sendCustomerMessage,
} from "@/modules/conversations/conversation.service";
import type {
  AssistantConversationStart,
  AssistantCustomerContext,
  AssistantSendMessageRequest,
  AssistantSendMessageResult,
} from "@/types/assistant";
import type { AssistantService } from "./assistant.service";

const HANDOFF_WAITING_TEXT =
  "Your conversation is with our support team. A team member will reply here shortly—you can leave additional details below.";

function messageBodyFromContent(
  content: import("@/types/assistant").AssistantMessageContent,
): string {
  if (content.type === "text") return content.text;
  if (content.type === "recommendations") return content.intro;
  if (content.type === "comparison") return content.summary;
  return content.message;
}

async function buildToolContext(conversationId: string): Promise<AiToolContext> {
  const session = await getRequestContext();
  const tenantId = session?.tenantId ?? (await resolvePublicTenantId());
  return {
    tenantId,
    conversationId,
    requestId: crypto.randomUUID(),
    userId: session?.userId,
    email: session?.email,
    customerId: session?.customerId ?? undefined,
    role: session?.role ?? "ANONYMOUS",
  };
}

export const liveAssistantService: AssistantService = {
  async startConversation(context?: AssistantCustomerContext): Promise<AssistantConversationStart> {
    const session = await getRequestContext();
    const tenantId = session?.tenantId ?? (await resolvePublicTenantId());
    const conversation = await createAssistantConversation({
      tenantId,
      customerId: session?.customerId ?? null,
      subject: "Shopping assistant",
    });

    const welcome = buildWelcomeMessage(context?.customerName);
    await appendConversationMessage({
      tenantId,
      conversationId: conversation.id,
      role: "AI",
      body: messageBodyFromContent(welcome.content),
      content: welcome.content,
    });

    return {
      conversationId: conversation.id,
      welcome,
      suggestedPrompts: ASSISTANT_SUGGESTED_PROMPTS,
      quickActions: ASSISTANT_QUICK_ACTIONS,
    };
  },

  async sendMessage(request: AssistantSendMessageRequest): Promise<AssistantSendMessageResult> {
    const limits = getAiLimits();
    const trimmed = request.message.trim();
    if (!trimmed) {
      return { ok: false, code: "empty_response", message: "Please enter a message to continue." };
    }
    if (trimmed.length > limits.maxMessageLength) {
      return { ok: false, code: "api_failure", message: "Message is too long." };
    }

    const ctx = await buildToolContext(request.conversationId);
    const rl = ctx.role === "ANONYMOUS" ? limits.anonymousRateLimit : limits.authenticatedRateLimit;
    const rlKey = `ai:${ctx.tenantId}:${ctx.userId ?? "anon"}`;
    const allowed = await rateLimit(rlKey, rl.limit, rl.windowSeconds);
    if (!allowed) {
      return {
        ok: false,
        code: "rate_limit",
        message: "You're sending messages quickly. Please wait a moment and try again.",
      };
    }

    let conversation;
    try {
      conversation = await assertCustomerConversationAccess(
        request.conversationId,
        ctx.tenantId,
        ctx.customerId ?? null,
      );
    } catch {
      return { ok: false, code: "api_failure", message: "Conversation not found. Please refresh." };
    }

    try {
      await sendCustomerMessage({
        tenantId: ctx.tenantId,
        conversationId: request.conversationId,
        customerId: ctx.customerId ?? null,
        body: trimmed,
        content: { type: "text", text: trimmed },
      });
    } catch {
      return {
        ok: false,
        code: "api_failure",
        message: "Unable to send message. Please try again.",
      };
    }

    if (conversationBlocksAiResponses(conversation.status)) {
      return {
        ok: true,
        conversationId: request.conversationId,
        message: {
          id: `handoff-${request.conversationId}`,
          role: "assistant",
          createdAt: new Date().toISOString(),
          content: { type: "text", text: HANDOFF_WAITING_TEXT },
        },
      };
    }

    try {
      await assertConversationAccess(request.conversationId, ctx.tenantId, ctx.customerId ?? null);
    } catch {
      return { ok: false, code: "api_failure", message: "Conversation not found. Please refresh." };
    }

    const { content } = await runAssistantOrchestrator({ userMessage: trimmed, ctx });

    const assistantRow = await appendConversationMessage({
      tenantId: ctx.tenantId,
      conversationId: request.conversationId,
      role: "AI",
      body: messageBodyFromContent(content),
      content,
    });

    return {
      ok: true,
      conversationId: request.conversationId,
      message: {
        id: assistantRow.id,
        role: "assistant",
        createdAt: assistantRow.createdAt.toISOString(),
        content,
      },
    };
  },
};
