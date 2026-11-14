import { describe, expect, it } from "vitest";

import { fromMinorUnits, multiplyMinor, toMinorUnits } from "@/lib/money";

describe("money (minor units)", () => {
  it("converts major to minor and back", () => {
    expect(toMinorUnits(1999, "NGN")).toBe(199900);
    expect(fromMinorUnits(199900, "NGN")).toBe(1999);
  });

  it("rejects invalid amounts", () => {
    expect(() => toMinorUnits(-1)).toThrow();
    expect(() => fromMinorUnits(1.5)).toThrow();
  });

  it("multiplies line totals in integer minor units", () => {
    expect(multiplyMinor(125000, 3)).toBe(375000);
  });
});
