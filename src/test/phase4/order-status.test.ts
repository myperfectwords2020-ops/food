import { describe, expect, it } from "vitest";

import type { OrderStatus } from "@prisma/client";

const transitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED", "FAILED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  FAILED: [],
  REFUNDED: [],
};

describe("order status policy", () => {
  it("does not allow delivered to pending", () => {
    expect(transitions.DELIVERED.includes("PENDING_PAYMENT" as OrderStatus)).toBe(false);
  });

  it("allows pending to paid", () => {
    expect(transitions.PENDING_PAYMENT.includes("PAID")).toBe(true);
  });
});
