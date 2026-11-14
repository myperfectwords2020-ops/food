"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { syncCartItemAction } from "@/app/actions/cart";
import {
  type ServerCartCache,
  patchServerCartLines,
  setServerCartCache,
} from "@/lib/query/cart-cache";
import { cartKeys } from "@/lib/query/query-keys";

export type { ServerCartCache };

export function useSyncCartItemMutation() {
  const queryClient = useQueryClient();
  const key = cartKeys.server();

  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      syncCartItemAction(productId, quantity),
    onMutate: async ({ productId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = patchServerCartLines(queryClient, productId, quantity);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        setServerCartCache(queryClient, context.previous);
      }
    },
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error ?? "Could not update your bag.");
        return;
      }
      const lines = result.summary.lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
      }));
      setServerCartCache(queryClient, {
        lines,
        summary: result.summary,
      });
    },
  });
}
