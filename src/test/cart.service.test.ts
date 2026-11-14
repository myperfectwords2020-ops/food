import { describe, expect, it } from "vitest";

import { buildCartSummary } from "@/services/cart.service";
import { mockCatalogService } from "@/services/catalog.mock";

describe("cart service", () => {
  it("calculates totals from server catalog prices", async () => {
    const products = await mockCatalogService.listProducts({ pageSize: 2 });
    const lines = products.items.map((p) => ({ productId: p.id, quantity: 2 }));
    const summary = await buildCartSummary(mockCatalogService, lines, { includeDelivery: true });
    expect(summary.subtotal).toBeGreaterThan(0);
    expect(summary.total).toBe(summary.subtotal + (summary.delivery ?? 0));
  });
});
