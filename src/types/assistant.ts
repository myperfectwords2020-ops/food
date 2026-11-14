export type AssistantErrorCode =
  | "timeout"
  | "rate_limit"
  | "api_failure"
  | "empty_response"
  | "unavailable"
  | "invalid_recommendation"
  | "product_unavailable";

export type AssistantMessageRole = "user" | "assistant" | "system";

export type AssistantProductRef = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  /** Display-only unit price from the assistant API — cart uses productId + server catalog. */
  displayPrice: number;
  category: string;
  concern: string;
  reason?: string | undefined;
};

export type AssistantMessageContent =
  | { type: "text"; text: string }
  | {
      type: "recommendations";
      intro: string;
      explanation: string;
      products: AssistantProductRef[];
    }
  | {
      type: "comparison";
      summary: string;
      products: AssistantProductRef[];
    }
  | { type: "error"; code: AssistantErrorCode; message: string };

export type AssistantChatMessage = {
  id: string;
  role: AssistantMessageRole;
  content: AssistantMessageContent;
  createdAt: string;
};

export type AssistantCustomerContext = {
  customerName?: string | undefined;
  email?: string | undefined;
  dietaryHint?: string | undefined;
  recentFocus?: string | undefined;
};

export type AssistantSendMessageRequest = {
  conversationId: string;
  message: string;
  context?: AssistantCustomerContext | undefined;
};

export type AssistantSendMessageResult =
  | { ok: true; message: AssistantChatMessage; conversationId: string }
  | { ok: false; code: AssistantErrorCode; message: string };

export type AssistantConversationStart = {
  conversationId: string;
  welcome: AssistantChatMessage;
  suggestedPrompts: string[];
  quickActions: { id: string; label: string; prompt: string }[];
};
