import { describe, expect, it } from "vitest";

import { mockCatalogService } from "@/services/catalog.mock";

describe("catalog service", () => {
  it("filters products by category", async () => {
    const result = await mockCatalogService.listProducts({ category: "Serum" });
    expect(result.items.every((p) => p.category === "Serum")).toBe(true);
  });

  it("sorts products by price ascending", async () => {
    const result = await mockCatalogService.listProducts({ sort: "price-asc", pageSize: 24 });
    const prices = result.items.map((p) => p.price);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });
});
