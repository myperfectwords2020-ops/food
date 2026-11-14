"use client";

import { useMutation } from "@tanstack/react-query";

import {
  sendAssistantMessageAction,
  startAssistantConversationAction,
} from "@/app/actions/assistant";
import { assistantKeys } from "@/lib/query/assistant-keys";

export function useStartAssistantConversation() {
  return useMutation({
    mutationKey: [...assistantKeys.all, "start"],
    mutationFn: () => startAssistantConversationAction(),
  });
}

export function useSendAssistantMessage() {
  return useMutation({
    mutationFn: (input: { conversationId: string; message: string }) =>
      sendAssistantMessageAction(input.conversationId, input.message),
  });
}
