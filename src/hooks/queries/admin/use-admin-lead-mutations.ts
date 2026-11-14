"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  addLeadNoteAction,
  assignLeadAction,
  changeLeadStatusAction,
  convertLeadAction,
  qualifyLeadAction,
} from "@/app/actions/crm";
import { adminKeys, leadKeys } from "@/lib/query/query-keys";

export function useConvertLeadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leadId: string) => {
      const result = await convertLeadAction(leadId);
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: (_data, leadId) => {
      void queryClient.invalidateQueries({ queryKey: leadKeys.detail(leadId) });
      void queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

export function useQualifyLeadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leadId: string) => {
      const result = await qualifyLeadAction(leadId);
      if (!result.ok) throw new Error(result.error.message);
    },
    onSuccess: (_data, leadId) => {
      void queryClient.invalidateQueries({ queryKey: leadKeys.detail(leadId) });
      void queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

export function useChangeLeadStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { leadId: string; status: string }) => {
      const result = await changeLeadStatusAction(input);
      if (!result.ok) throw new Error(result.error.message);
    },
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: leadKeys.detail(input.leadId) });
      void queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

export function useAssignLeadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { leadId: string; ownerId: string | null }) => {
      const result = await assignLeadAction(input);
      if (!result.ok) throw new Error(result.error.message);
    },
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: leadKeys.detail(input.leadId) });
      void queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

export function useAddLeadNoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { leadId: string; note: string }) => {
      const result = await addLeadNoteAction(input);
      if (!result.ok) throw new Error(result.error.message);
    },
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: leadKeys.detail(input.leadId) });
    },
  });
}
