import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { useSyncCartItemMutation, type ServerCartCache } from "@/hooks/queries/use-cart-mutations";
import { cartKeys } from "@/lib/query/query-keys";

vi.mock("@/app/actions/cart", () => ({
  syncCartItemAction: vi.fn(),
}));

import { syncCartItemAction } from "@/app/actions/cart";

const emptySummary = {
  lines: [],
  subtotal: 0,
  delivery: null,
  discount: 0,
  total: 0,
  currency: "NGN" as const,
};

describe("useSyncCartItemMutation optimistic rollback", () => {
  let client: QueryClient;

  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    vi.mocked(syncCartItemAction).mockReset();
  });

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  it("writes optimistic lines even when the server cart cache is empty", async () => {
    vi.mocked(syncCartItemAction).mockResolvedValueOnce({
      ok: true,
      summary: {
        ...emptySummary,
        lines: [
          {
            productId: "p1",
            quantity: 1,
            name: "Cleanser",
            slug: "cleanser",
            image: "/x.jpg",
            unitPrice: 10,
            lineTotal: 10,
            maxQuantity: 5,
          },
        ],
      },
    });

    const { result } = renderHook(() => useSyncCartItemMutation(), { wrapper });

    result.current.mutate({ productId: "p1", quantity: 1 });

    await waitFor(() => {
      expect(client.getQueryData<ServerCartCache>(cartKeys.server())?.lines).toEqual([
        { productId: "p1", quantity: 1 },
      ]);
    });
  });

  it("restores previous cache when mutation fails", async () => {
    const key = cartKeys.server();
    const previous: ServerCartCache = {
      lines: [{ productId: "p1", quantity: 1 }],
      summary: emptySummary,
    };
    client.setQueryData(key, previous);

    vi.mocked(syncCartItemAction).mockRejectedValueOnce(new Error("fail"));

    const { result } = renderHook(() => useSyncCartItemMutation(), { wrapper });

    result.current.mutate({ productId: "p1", quantity: 2 });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData<ServerCartCache>(key)).toEqual(previous);
  });
});
