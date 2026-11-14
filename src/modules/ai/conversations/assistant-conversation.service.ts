import type { AssistantChatMessage, AssistantMessageContent } from "@/types/assistant";
import type { RequestContext } from "@/lib/auth/types";
import {
  appendMessage,
  createConversation,
  getStaffConversationDetail,
  listStaffConversations,
  loadCustomerVisibleMessages,
  requestHumanHandoff,
  assertCustomerConversationAccess,
} from "@/modules/conversations/conversation.service";

const DISCLAIMER =
  "My answers come from our live catalog—always check product labels for allergens.";

function msgId() {
  return `msg-${crypto.randomUUID()}`;
}

function nowIso() {
  return new Date().toISOString();
}

export function buildWelcomeMessage(customerName?: string): AssistantChatMessage {
  const name = customerName ? `, ${customerName}` : "";
  return {
    id: msgId(),
    role: "assistant",
    createdAt: nowIso(),
    content: {
      type: "text",
      text: `Hello${name}! I'm the Greencart assistant. I can help you find fresh groceries, compare products, plan meals from what's in stock, and check your orders. ${DISCLAIMER} What are you shopping for today?`,
    },
  };
}

export const ASSISTANT_SUGGESTED_PROMPTS = [
  "What can I make for breakfast?",
  "Show me vegan snacks",
  "Compare apples and bananas",
  "Where is my order?",
];

export const ASSISTANT_QUICK_ACTIONS = [
  { id: "discover", label: "Fresh produce", prompt: "Show me fresh fruits and vegetables" },
  { id: "meal", label: "Meal ideas", prompt: "What do I need for a simple stew tonight?" },
  { id: "dietary", label: "Gluten-free picks", prompt: "Recommend gluten-free groceries" },
  { id: "order", label: "Order status", prompt: "Where is my order?" },
];

export async function createAssistantConversation(input: {
  tenantId: string;
  customerId?: string | null;
  leadId?: string | null;
  subject?: string;
}) {
  return createConversation({
    tenantId: input.tenantId,
    customerId: input.customerId ?? null,
    leadId: input.leadId ?? null,
    subject: input.subject ?? "Shopping assistant",
    channel: "AI_ASSISTANT",
  });
}

export { assertCustomerConversationAccess as assertConversationAccess };

export async function appendConversationMessage(input: {
  tenantId: string;
  conversationId: string;
  role: "CUSTOMER" | "AI" | "SYSTEM";
  body: string;
  content?: AssistantMessageContent;
  metadata?: Record<string, unknown>;
}) {
  return appendMessage({
    tenantId: input.tenantId,
    conversationId: input.conversationId,
    role: input.role,
    body: input.body,
    ...(input.content ? { content: input.content } : {}),
    ...(input.metadata ? { metadata: input.metadata } : {}),
  });
}

export async function loadRecentConversationMessages(
  tenantId: string,
  conversationId: string,
  limit: number,
  customerId?: string | null,
): Promise<AssistantChatMessage[]> {
  const rows = await loadCustomerVisibleMessages(
    tenantId,
    conversationId,
    customerId ?? null,
    limit,
  );

  return rows.map((m) => {
    const meta = m.metadata as { content?: AssistantMessageContent } | null;
    const content =
      meta?.content ?? ({ type: "text", text: m.body } satisfies AssistantMessageContent);
    return {
      id: m.id,
      role:
        m.role === "CUSTOMER" ? "user" : m.role === "HUMAN" ? "assistant" : ("assistant" as const),
      createdAt: m.createdAt.toISOString(),
      content,
    };
  });
}

export async function requestHandoff(conversationId: string, tenantId: string, reason: string) {
  await requestHumanHandoff({
    tenantId,
    conversationId,
    reason,
  });
}

export async function listAdminConversations(
  context: RequestContext,
  filters: {
    q?: string | undefined;
    status?: string | undefined;
    channel?: string | undefined;
    assignedToUserId?: string | undefined;
  },
  page: number,
  pageSize: number,
) {
  if (filters.channel && filters.channel !== "ai_assistant") {
    return { items: [], page, pageSize, total: 0, totalPages: 1 };
  }
  return listStaffConversations(
    context,
    { q: filters.q, status: filters.status, assignedToUserId: filters.assignedToUserId },
    page,
    pageSize,
  );
}

export async function getAdminConversation(context: RequestContext, id: string) {
  return getStaffConversationDetail(context, id);
}
