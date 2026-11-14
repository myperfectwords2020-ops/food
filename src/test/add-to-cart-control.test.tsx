import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { AddToCartControl } from "@/components/product/add-to-cart-control";
import { renderWithProviders } from "@/test/test-utils";

const useCartMock = vi.fn();
const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/components/cart/cart-context", () => ({
  useCart: (...args: unknown[]) => useCartMock(...args),
}));

vi.mock("@/app/actions/analytics-events", () => ({
  recordStorefrontAddToCartAction: vi.fn(async () => ({ ok: true })),
}));

describe("AddToCartControl", () => {
  beforeEach(() => {
    useCartMock.mockReset();
    pushMock.mockReset();
  });

  it("shows cart quantity when product is already in the bag", () => {
    useCartMock.mockReturnValue({
      lines: [{ productId: "p1", quantity: 2 }],
      setQuantity: vi.fn(),
    });

    renderWithProviders(<AddToCartControl productId="p1" unitPrice={1000} maxQuantity={10} />);

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /2 in bag/i })).toBeInTheDocument();
  });

  it("adds selected quantity and opens checkout when Buy now is clicked", () => {
    const setQuantity = vi.fn();
    useCartMock.mockReturnValue({
      lines: [],
      setQuantity,
    });

    renderWithProviders(
      <AddToCartControl productId="p1" unitPrice={1000} maxQuantity={10} showBuyNow />,
    );

    fireEvent.click(screen.getByRole("button", { name: /buy now/i }));

    expect(setQuantity).toHaveBeenCalledWith("p1", 1);
    expect(pushMock).toHaveBeenCalledWith("/checkout");
  });
});
