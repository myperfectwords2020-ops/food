"use server";

import { getRequestContext } from "@/lib/auth/request-context";
import { accountService, assistantService } from "@/services/index";
import type { AssistantCustomerContext, AssistantSendMessageResult } from "@/types/assistant";

const MAX_MESSAGE_LENGTH = 2000;

async function optionalCustomerContext(): Promise<AssistantCustomerContext | undefined> {
  const ctx = await getRequestContext();
  if (!ctx || ctx.role !== "CUSTOMER" || !ctx.customerId) return undefined;
  try {
    const profile = await accountService.getProfile();
    return {
      customerName: profile.firstName,
      email: profile.email,
    };
  } catch {
    return undefined;
  }
}

export async function startAssistantConversationAction(): Promise<
  Awaited<ReturnType<typeof assistantService.startConversation>>
> {
  const context = await optionalCustomerContext();
  return assistantService.startConversation(context);
}

export async function sendAssistantMessageAction(
  conversationId: string,
  message: string,
): Promise<AssistantSendMessageResult> {
  if (!conversationId) {
    return { ok: false, code: "api_failure", message: "Conversation not found. Please refresh." };
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return {
      ok: false,
      code: "api_failure",
      message: "Message is too long. Please shorten and try again.",
    };
  }

  const context = await optionalCustomerContext();
  return assistantService.sendMessage({
    conversationId,
    message,
    context,
  });
}
