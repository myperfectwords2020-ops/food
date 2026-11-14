import { describe, expect, it } from "vitest";

import { normalizeEmail, normalizePhone } from "@/modules/leads/lead-phone";

describe("lead phone normalization", () => {
  it("normalizes Nigerian local numbers", () => {
    expect(normalizePhone("08012345678")).toBe("2348012345678");
  });

  it("normalizes email", () => {
    expect(normalizeEmail("  Test@Example.COM ")).toBe("test@example.com");
  });
});
