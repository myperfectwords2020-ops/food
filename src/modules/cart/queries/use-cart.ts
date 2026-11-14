"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";

import { fetchCustomerCartAction, mergeLocalCartAction } from "@/app/actions/cart";
import { getCartSummaryFromLinesAction } from "@/app/actions/commerce";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useSyncCartItemMutation } from "@/hooks/queries/use-cart-mutations";
import { resolveCartLines } from "@/lib/cart/resolve-cart-lines";
import {
  bootstrapCartSession,
  readGuestCartLines,
  writeGuestCartLines,
} from "@/lib/query/bootstrap-cart";
import {
  emptyCartSummary,
  seedGuestCartFromStorage,
  setGuestCartLines,
  setServerCartCache,
  updateGuestCartLines,
  type ServerCartCache,
} from "@/lib/query/cart-cache";
import { cartKeys } from "@/lib/query/query-keys";
import type { CartLineInput, CartSummary } from "@/types/commerce";

const emptyLines: CartLineInput[] = [];

/** One merge per tab, even though several components call useCart(). */
let guestMergeStarted = false;

type UseCartOptions = {
  /** Set false for count-only consumers (badge, add buttons) to skip cart pricing requests. */
  includeSummary?: boolean;
};

const cartQueryOptions = {
  staleTime: Number.POSITIVE_INFINITY,
  gcTime: Number.POSITIVE_INFINITY,
  refetchOnMount: false as const,
  refetchOnReconnect: false as const,
  refetchOnWindowFocus: false as const,
};

/** Cart state via TanStack Query. Guest and server lines share one cache so the header badge updates immediately. */
export function useCart({ includeSummary = true }: UseCartOptions = {}) {
  const queryClient = useQueryClient();
  const syncMutation = useSyncCartItemMutation();

  useEffect(() => {
    seedGuestCartFromStorage(queryClient);
  }, [queryClient]);

  const bootstrapQuery = useQuery({
    queryKey: cartKeys.bootstrap(),
    queryFn: async () => {
      const result = await bootstrapCartSession();
      if (result.mode === "server") {
        setServerCartCache(queryClient, {
          lines: result.lines,
          summary: result.summary,
        });
      } else {
        const current = queryClient.getQueryData<CartLineInput[]>(cartKeys.guestLines());
        if (!current?.length) {
          setGuestCartLines(queryClient, result.lines);
        }
      }
      return result;
    },
    ...cartQueryOptions,
  });

  const bootstrapReady = bootstrapQuery.isSuccess;
  const serverCart = bootstrapReady && bootstrapQuery.data?.mode === "server";

  const guestLinesQuery = useQuery({
    queryKey: cartKeys.guestLines(),
    queryFn: async () => {
      const cached = queryClient.getQueryData<CartLineInput[]>(cartKeys.guestLines());
      if (cached && cached.length > 0) return cached;
      return readGuestCartLines();
    },
    ...cartQueryOptions,
  });

  const guestLines = guestLinesQuery.data ?? emptyLines;

  const serverCartQuery = useQuery({
    queryKey: cartKeys.server(),
    queryFn: async (): Promise<ServerCartCache> => {
      const remote = await fetchCustomerCartAction();
      if (!remote) {
        return (
          queryClient.getQueryData<ServerCartCache>(cartKeys.server()) ?? {
            lines: [],
            summary: emptyCartSummary,
          }
        );
      }
      return remote;
    },
    enabled: serverCart,
    ...cartQueryOptions,
  });

  useEffect(() => {
    if (!serverCart || guestMergeStarted) return;
    const pending =
      queryClient.getQueryData<CartLineInput[]>(cartKeys.guestLines()) ?? readGuestCartLines();
    if (pending.length === 0) return;

    guestMergeStarted = true;
    void mergeLocalCartAction(pending).then(async (result) => {
      writeGuestCartLines([]);
      setGuestCartLines(queryClient, []);
      if (!result.ok) {
        guestMergeStarted = false;
        return;
      }
      const remote = await fetchCustomerCartAction();
      if (remote) setServerCartCache(queryClient, remote);
    });
  }, [serverCart, queryClient]);

  const lines = useMemo(
    () => resolveCartLines(serverCart, serverCartQuery.data?.lines, guestLines),
    [serverCart, serverCartQuery.data?.lines, guestLines],
  );

  const debouncedGuestLines = useDebouncedValue(guestLines, 350);

  const serverLinesEmpty =
    serverCart && (serverCartQuery.data?.lines.length ?? 0) === 0 && guestLines.length > 0;

  const guestSummaryQuery = useQuery({
    queryKey: cartKeys.guestSummaryFromLines(debouncedGuestLines),
    queryFn: () => getCartSummaryFromLinesAction(debouncedGuestLines),
    enabled: includeSummary && (!serverCart || serverLinesEmpty) && debouncedGuestLines.length > 0,
    staleTime: 30_000,
    placeholderData: (previous) => previous ?? emptyCartSummary,
  });

  const summary: CartSummary = serverCart
    ? serverLinesEmpty
      ? (guestSummaryQuery.data ?? emptyCartSummary)
      : (serverCartQuery.data?.summary ?? emptyCartSummary)
    : guestLines.length === 0
      ? emptyCartSummary
      : (guestSummaryQuery.data ?? emptyCartSummary);

  const isLoading =
    includeSummary &&
    ((serverCart && serverCartQuery.isPending && !serverCartQuery.data) ||
      (!serverCart &&
        guestLines.length > 0 &&
        guestSummaryQuery.isFetching &&
        !guestSummaryQuery.data));

  const syncServer = useCallback(
    (productId: string, quantity: number) => {
      syncMutation.mutate({ productId, quantity });
    },
    [syncMutation],
  );

  const addItem = useCallback(
    (productId: string, quantity = 1) => {
      if (serverCart) {
        const existing = lines.find((l) => l.productId === productId);
        syncServer(productId, (existing?.quantity ?? 0) + quantity);
        return;
      }
      updateGuestCartLines(queryClient, (prev) => {
        const existing = prev.find((l) => l.productId === productId);
        return existing
          ? prev.map((l) =>
              l.productId === productId ? { ...l, quantity: l.quantity + quantity } : l,
            )
          : [...prev, { productId, quantity }];
      });
    },
    [lines, queryClient, serverCart, syncServer],
  );

  const removeItem = useCallback(
    (productId: string) => {
      if (serverCart) {
        syncServer(productId, 0);
        return;
      }
      updateGuestCartLines(queryClient, (prev) => prev.filter((l) => l.productId !== productId));
    },
    [queryClient, serverCart, syncServer],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (serverCart) {
        syncServer(productId, quantity);
        return;
      }
      updateGuestCartLines(queryClient, (prev) =>
        quantity < 1
          ? prev.filter((l) => l.productId !== productId)
          : prev.some((l) => l.productId === productId)
            ? prev.map((l) => (l.productId === productId ? { ...l, quantity } : l))
            : [...prev, { productId, quantity }],
      );
    },
    [queryClient, serverCart, syncServer],
  );

  const clearCart = useCallback(() => {
    if (serverCart) {
      for (const line of lines) syncServer(line.productId, 0);
      setServerCartCache(queryClient, { lines: [], summary: emptyCartSummary });
    }
    setGuestCartLines(queryClient, []);
  }, [lines, queryClient, serverCart, syncServer]);

  const itemCount = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);

  return {
    lines,
    summary,
    isLoading,
    itemCount,
    bootstrapReady,
    addItem,
    removeItem,
    setQuantity,
    clearCart,
  };
}
