"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adjustInventoryAction } from "@/app/actions/admin";
import { fetchAdminInventoryAction } from "@/app/actions/admin-queries";
import { queryKeys } from "@/lib/query/keys";

export function useAdminInventoryQuery() {
  return useQuery({
    queryKey: queryKeys.admin.inventory,
    queryFn: () => fetchAdminInventoryAction(),
  });
}

export function useAdjustInventoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, delta, note }: { productId: string; delta: number; note: string }) =>
      adjustInventoryAction(productId, delta, note),
    onSuccess: (result) => {
      if (result.ok) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.admin.inventory });
      }
    },
  });
}
