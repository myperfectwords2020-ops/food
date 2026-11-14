import { describe, expect, it } from "vitest";

import { catalogTextSearchWhere } from "@/modules/catalog/catalog-query";

describe("catalogTextSearchWhere", () => {
  it("searches indexed name, sku, slug, and category name only", () => {
    const where = catalogTextSearchWhere("vegetables");
    expect(where.OR).toEqual([
      { name: { contains: "vegetables", mode: "insensitive" } },
      { sku: { contains: "vegetables", mode: "insensitive" } },
      { slug: { contains: "vegetables", mode: "insensitive" } },
      { category: { name: { contains: "vegetables", mode: "insensitive" } } },
    ]);
    const serialized = JSON.stringify(where);
    expect(serialized).not.toContain("description");
    expect(serialized).not.toContain("ingredients");
  });
});
