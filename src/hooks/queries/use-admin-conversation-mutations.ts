"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  assignConversationToSelfAction,
  closeConversationAction,
  reopenConversationAction,
  resolveConversationAction,
  staffInternalNoteAction,
  staffReplyConversationAction,
} from "@/app/actions/conversations";
import { conversationKeys } from "@/lib/query/conversation-keys";

export function useStaffReplyMutation(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { body: string; idempotencyKey: string }) => {
      const result = await staffReplyConversationAction(
        conversationId,
        input.body,
        input.idempotencyKey,
      );
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.staffDetail(conversationId),
      });
      void queryClient.invalidateQueries({ queryKey: conversationKeys.all });
    },
  });
}

export function useStaffInternalNoteMutation(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const result = await staffInternalNoteAction(conversationId, body);
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.staffDetail(conversationId),
      });
    },
  });
}

export function useAssignConversationToSelfMutation(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const result = await assignConversationToSelfAction(conversationId);
      if (!result.ok) throw new Error(result.error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.staffDetail(conversationId),
      });
      void queryClient.invalidateQueries({ queryKey: conversationKeys.all });
    },
  });
}

export function useResolveConversationMutation(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const result = await resolveConversationAction(conversationId);
      if (!result.ok) throw new Error(result.error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.staffDetail(conversationId),
      });
      void queryClient.invalidateQueries({ queryKey: conversationKeys.all });
    },
  });
}

export function useCloseConversationMutation(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const result = await closeConversationAction(conversationId);
      if (!result.ok) throw new Error(result.error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.staffDetail(conversationId),
      });
      void queryClient.invalidateQueries({ queryKey: conversationKeys.all });
    },
  });
}

export function useReopenConversationMutation(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const result = await reopenConversationAction(conversationId);
      if (!result.ok) throw new Error(result.error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.staffDetail(conversationId),
      });
      void queryClient.invalidateQueries({ queryKey: conversationKeys.all });
    },
  });
}
