import { describe, expect, it } from "vitest";

import { formatCheckoutDelivery } from "@/lib/checkout-display";
import type { CartSummary } from "@/types/commerce";

const base: CartSummary = {
  lines: [],
  subtotal: 3500,
  delivery: null,
  discount: 0,
  total: 3500,
  currency: "NGN",
};

describe("formatCheckoutDelivery", () => {
  it("shows delivery fee when priced", () => {
    expect(formatCheckoutDelivery({ ...base, delivery: 1500 }, true)).toBe("₦1,500");
  });

  it("shows zero when state is selected and fee is absent from payload", () => {
    expect(formatCheckoutDelivery(base, true)).toBe("₦0");
  });

  it("shows dash when no state selected yet", () => {
    expect(formatCheckoutDelivery(base, false)).toBe("—");
  });
});
