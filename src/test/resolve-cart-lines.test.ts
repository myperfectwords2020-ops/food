import { describe, expect, it } from "vitest";

import { resolveCartLines } from "@/lib/cart/resolve-cart-lines";

describe("resolveCartLines", () => {
  const guest = [{ productId: "p1", quantity: 2 }];

  it("prefers guest lines while the server cart is still empty after login", () => {
    expect(resolveCartLines(true, [], guest)).toEqual(guest);
  });

  it("uses server lines once synced", () => {
    const server = [{ productId: "p1", quantity: 2 }];
    expect(resolveCartLines(true, server, guest)).toEqual(server);
  });

  it("uses guest lines for guest shoppers", () => {
    expect(resolveCartLines(false, undefined, guest)).toEqual(guest);
  });
});
