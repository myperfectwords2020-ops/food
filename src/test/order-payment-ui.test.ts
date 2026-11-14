import { describe, expect, it } from "vitest";

import { orderNeedsPayment } from "@/lib/orders/order-payment-ui";

describe("orderNeedsPayment", () => {
  it("is true for unpaid pending_payment orders", () => {
    expect(orderNeedsPayment({ status: "pending_payment", paymentStatus: "pending" })).toBe(true);
  });

  it("is false once paid", () => {
    expect(orderNeedsPayment({ status: "processing", paymentStatus: "paid" })).toBe(false);
  });
});
