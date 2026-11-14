import { describe, expect, it } from "vitest";

import { buildShopQueryString, parseShopSearchParams } from "@/lib/shop-search-params";

describe("shop filter URL helpers", () => {
  it("round-trips category filter for optimistic navigation", () => {
    const filters = parseShopSearchParams({ category: "Serum", page: "2" });
    expect(filters.category).toBe("Serum");
    expect(filters.page).toBe(2);

    const qs = buildShopQueryString({ ...filters, category: "Serum", page: 1 });
    expect(qs).toContain("category=Serum");
    expect(qs).not.toContain("page=2");
  });
});
