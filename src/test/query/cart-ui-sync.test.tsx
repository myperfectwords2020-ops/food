import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { CartBadge } from "@/components/cart/cart-badge";
import { useCart } from "@/modules/cart/queries/use-cart";
import { renderWithProviders } from "@/test/test-utils";
import { screen } from "@testing-library/react";

vi.mock("@/lib/query/bootstrap-cart", async () => {
  const storage = await import("@/lib/query/guest-cart-storage");
  return {
    bootstrapCartSession: vi.fn(async () => ({
      mode: "guest" as const,
      lines: storage.readGuestCartLines(),
    })),
    readGuestCartLines: storage.readGuestCartLines,
    writeGuestCartLines: storage.writeGuestCartLines,
    clearGuestCartStorage: storage.clearGuestCartStorage,
  };
});

describe("cart UI cache sync", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("updates a second useCart subscriber when addItem runs", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    function wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    }

    const adder = renderHook(() => useCart({ includeSummary: false }), { wrapper });
    const badge = renderHook(() => useCart({ includeSummary: false }), { wrapper });

    await waitFor(() => expect(adder.result.current.bootstrapReady).toBe(true));

    act(() => {
      adder.result.current.addItem("p1", 2);
    });

    await waitFor(() => expect(badge.result.current.itemCount).toBe(2));
    expect(badge.result.current.lines).toEqual([{ productId: "p1", quantity: 2 }]);
  });

  it("adds a new guest line when setQuantity is used for a product not yet in the bag", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    function wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useCart({ includeSummary: false }), { wrapper });

    await waitFor(() => expect(result.current.bootstrapReady).toBe(true));

    act(() => {
      result.current.setQuantity("p-new", 3);
    });

    await waitFor(() => expect(result.current.itemCount).toBe(3));
    expect(result.current.lines).toEqual([{ productId: "p-new", quantity: 3 }]);
  });

  it("renders the header badge count after addItem", async () => {
    const { getByRole } = renderWithProviders(
      <>
        <CartAdder />
        <CartBadge />
      </>,
    );

    await waitFor(() => expect(getByRole("button", { name: "add" })).toBeInTheDocument());

    act(() => {
      getByRole("button", { name: "add" }).click();
    });

    await waitFor(() => expect(screen.getByText("1")).toBeInTheDocument());
  });
});

function CartAdder() {
  const { addItem } = useCart({ includeSummary: false });
  return (
    <button type="button" onClick={() => addItem("p1", 1)}>
      add
    </button>
  );
}
