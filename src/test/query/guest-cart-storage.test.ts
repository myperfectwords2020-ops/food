import { describe, expect, it } from "vitest";

import { cartLinesKey } from "@/lib/query/query-utils";

describe("guest cart storage helpers", () => {
  it("cartLinesKey stays stable for guest summary cache keys", () => {
    expect(cartLinesKey([{ productId: "a", quantity: 2 }])).toBe("a:2");
  });
});
