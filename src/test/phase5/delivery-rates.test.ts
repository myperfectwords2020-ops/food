import { describe, expect, it } from "vitest";

import { normalizeNigeriaStateCode } from "@/lib/geo/nigeria-states";
import { priceCartLines } from "@/modules/commerce/pricing.service";

describe("Nigeria state delivery input", () => {
  it("normalizes state codes and legacy labels", () => {
    expect(normalizeNigeriaStateCode("LA")).toBe("LA");
    expect(normalizeNigeriaStateCode("Lagos")).toBe("LA");
    expect(normalizeNigeriaStateCode("Abuja FCT")).toBe("FC");
  });
});

describe("pricing with state delivery override", () => {
  it("uses admin-configured delivery minor units", () => {
    const products = new Map([
      [
        "p1",
        {
          id: "p1",
          slug: "x",
          name: "X",
          sku: null,
          status: "ACTIVE",
          priceMinor: 100_000,
          currency: "NGN",
          stock: 5,
          reservedStock: 0,
          images: [],
        },
      ],
    ]);
    const { breakdown } = priceCartLines([{ productId: "p1", quantity: 1 }], products, {
      includeDelivery: true,
      deliveryMinor: 500_000,
    });
    expect(breakdown.deliveryMinor).toBe(500_000);
    expect(breakdown.totalMinor).toBe(600_000);
  });
});
