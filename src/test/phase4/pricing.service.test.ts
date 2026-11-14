import { describe, expect, it } from "vitest";

import { priceCartLines } from "@/modules/commerce/pricing.service";

describe("order pricing", () => {
  it("calculates subtotal and delivery server-side", () => {
    const products = new Map([
      [
        "p1",
        {
          id: "p1",
          slug: "serum",
          name: "Serum",
          sku: null,
          status: "ACTIVE",
          priceMinor: 250_000,
          currency: "NGN",
          stock: 5,
          reservedStock: 0,
          images: [{ url: "https://example.com/x.jpg" }],
        },
      ],
    ]);

    const { breakdown } = priceCartLines([{ productId: "p1", quantity: 2 }], products, {
      includeDelivery: true,
    });

    expect(breakdown.subtotalMinor).toBe(500_000);
    expect(breakdown.deliveryMinor).toBeGreaterThan(0);
    expect(breakdown.totalMinor).toBe(breakdown.subtotalMinor + breakdown.deliveryMinor);
  });

  it("ignores inactive products", () => {
    const products = new Map([
      [
        "p1",
        {
          id: "p1",
          slug: "x",
          name: "X",
          sku: null,
          status: "ARCHIVED",
          priceMinor: 100,
          currency: "NGN",
          stock: 5,
          reservedStock: 0,
          images: [],
        },
      ],
    ]);
    const { breakdown, issues } = priceCartLines([{ productId: "p1", quantity: 1 }], products);
    expect(breakdown.lines).toHaveLength(0);
    expect(issues[0]?.code).toBe("PRODUCT_UNAVAILABLE");
  });
});
