"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { listDeliveryRatesAction, saveDeliveryRatesAction } from "@/app/actions/delivery-rates";
import { queryKeys } from "@/lib/query/keys";

export function useAdminDeliveryRatesQuery() {
  return useQuery({
    queryKey: queryKeys.admin.deliveryRates,
    queryFn: () => listDeliveryRatesAction(),
  });
}

export function useSaveDeliveryRatesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveDeliveryRatesAction,
    onSuccess: (result) => {
      if (result.ok) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.admin.deliveryRates });
      }
    },
  });
}
