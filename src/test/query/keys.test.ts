import { describe, expect, it } from "vitest";

import { cartLinesKey } from "@/lib/query/keys";

describe("cartLinesKey", () => {
  it("is stable regardless of line order", () => {
    const a = cartLinesKey([
      { productId: "b", quantity: 2 },
      { productId: "a", quantity: 1 },
    ]);
    const b = cartLinesKey([
      { productId: "a", quantity: 1 },
      { productId: "b", quantity: 2 },
    ]);
    expect(a).toBe(b);
  });
});
