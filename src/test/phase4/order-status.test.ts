import { describe, expect, it } from "vitest";

import type { OrderStatus } from "@prisma/client";

import { ORDER_STATUS_TRANSITIONS as transitions } from "@/modules/orders/order-status.service";

describe("order status policy", () => {
  it("does not allow delivered to pending", () => {
    expect(transitions.DELIVERED.includes("PENDING_PAYMENT" as OrderStatus)).toBe(false);
  });

  it("allows pending to paid", () => {
    expect(transitions.PENDING_PAYMENT.includes("PAID")).toBe(true);
  });
});
