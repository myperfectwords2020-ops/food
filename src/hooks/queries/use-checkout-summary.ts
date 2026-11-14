"use client";

import { useQuery } from "@tanstack/react-query";

import { getCheckoutSummaryFromLinesAction } from "@/app/actions/commerce";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { checkoutKeys } from "@/lib/query/query-keys";
import { staleTimes } from "@/lib/query/stale-times";
import type { CartLineInput, CartSummary } from "@/types/commerce";

const emptySummary: CartSummary = {
  lines: [],
  subtotal: 0,
  delivery: null,
  discount: 0,
  total: 0,
  currency: "NGN",
};

export function useCheckoutSummaryQuery(shippingStateCode: string, cartLines: CartLineInput[]) {
  const debouncedState = useDebouncedValue(shippingStateCode, 200);
  const debouncedLines = useDebouncedValue(cartLines, 300);

  return useQuery({
    queryKey: checkoutKeys.summaryFromLines(debouncedState, debouncedLines),
    queryFn: () => getCheckoutSummaryFromLinesAction(debouncedLines, debouncedState),
    enabled: debouncedLines.length > 0,
    staleTime: staleTimes.checkout,
    placeholderData: (previous) => previous ?? emptySummary,
  });
}
