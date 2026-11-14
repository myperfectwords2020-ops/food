import { describe, expect, it } from "vitest";

import { getAdminOrderStatusOptions } from "@/modules/orders/admin-order.service";
import { adminSelectableOrderTargets } from "@/modules/orders/order-status.service";

describe("admin order status options", () => {
  it("offers full fulfillment path after paid", () => {
    expect(getAdminOrderStatusOptions("paid")).toEqual([
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ]);
  });

  it("does not allow manual mark-paid from pending payment", () => {
    expect(adminSelectableOrderTargets("PENDING_PAYMENT")).toEqual(["CANCELLED"]);
  });

  it("allows skip-ahead after processing", () => {
    expect(getAdminOrderStatusOptions("processing")).toEqual(["shipped", "delivered", "cancelled"]);
  });
});

describe("fulfillment transition steps", () => {
  it("walks from paid to shipped through processing", async () => {
    const { fulfillmentTransitionSteps } = await import("@/modules/orders/order-status.service");
    expect(fulfillmentTransitionSteps("PAID", "SHIPPED")).toEqual(["PROCESSING", "SHIPPED"]);
  });
});
