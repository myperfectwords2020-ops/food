import type { QueryClient } from "@tanstack/react-query";

import { cartKeys } from "@/lib/query/query-keys";
import { readGuestCartLines, writeGuestCartLines } from "@/lib/query/guest-cart-storage";
import type { CartLineInput, CartSummary } from "@/types/commerce";

export const emptyCartSummary: CartSummary = {
  lines: [],
  subtotal: 0,
  delivery: null,
  discount: 0,
  total: 0,
  currency: "NGN",
};

export type ServerCartCache = {
  lines: CartLineInput[];
  summary: CartSummary;
};

export function emptyServerCart(): ServerCartCache {
  return { lines: [], summary: emptyCartSummary };
}

export function seedGuestCartFromStorage(queryClient: QueryClient) {
  const current = queryClient.getQueryData<CartLineInput[]>(cartKeys.guestLines());
  if (current && current.length > 0) return;
  const stored = readGuestCartLines();
  if (stored.length > 0) {
    queryClient.setQueryData<CartLineInput[]>(cartKeys.guestLines(), stored);
  }
}

export function setGuestCartLines(queryClient: QueryClient, next: CartLineInput[]) {
  writeGuestCartLines(next);
  queryClient.setQueryData<CartLineInput[]>(cartKeys.guestLines(), next);
}

export function updateGuestCartLines(
  queryClient: QueryClient,
  updater: (prev: CartLineInput[]) => CartLineInput[],
) {
  const prev =
    queryClient.getQueryData<CartLineInput[]>(cartKeys.guestLines()) ?? readGuestCartLines();
  setGuestCartLines(queryClient, updater(prev));
}

export function setServerCartCache(queryClient: QueryClient, next: ServerCartCache) {
  queryClient.setQueryData<ServerCartCache>(cartKeys.server(), next);
}

export function patchServerCartLines(
  queryClient: QueryClient,
  productId: string,
  quantity: number,
): ServerCartCache {
  const previous =
    queryClient.getQueryData<ServerCartCache>(cartKeys.server()) ?? emptyServerCart();
  const lines =
    quantity <= 0
      ? previous.lines.filter((l) => l.productId !== productId)
      : previous.lines.some((l) => l.productId === productId)
        ? previous.lines.map((l) => (l.productId === productId ? { ...l, quantity } : l))
        : [...previous.lines, { productId, quantity }];
  const next = { ...previous, lines };
  setServerCartCache(queryClient, next);
  return previous;
}
