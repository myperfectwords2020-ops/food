import { describe, expect, it } from "vitest";

import { adminKeys, cartKeys, checkoutKeys, queryKeys } from "@/lib/query/query-keys";

describe("query key factories", () => {
  it("cartKeys.bootstrap and legacy queryKeys.cart.bootstrap match", () => {
    expect(cartKeys.bootstrap()).toEqual(queryKeys.cart.bootstrap);
  });

  it("admin order keys include filter object", () => {
    const filters = { page: 2, pageSize: 10, q: "test" };
    expect(adminKeys.orders(filters)).toEqual(["admin", "orders", filters]);
    expect(queryKeys.admin.orders(filters)).toEqual(adminKeys.orders(filters));
  });

  it("checkout summary keys include state and lines fingerprint", () => {
    const key = checkoutKeys.summaryFromLines("LA", [{ productId: "p1", quantity: 1 }]);
    expect(key[0]).toBe("checkout");
    expect(key[1]).toBe("summary");
    expect(key[2]).toBe("LA");
    expect(typeof key[3]).toBe("string");
  });
});
