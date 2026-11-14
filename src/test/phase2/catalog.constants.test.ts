import { describe, expect, it } from "vitest";

import { normalizePageSize } from "@/modules/catalog/catalog.constants";

describe("catalog pagination", () => {
  it("caps page size at 50", () => {
    expect(normalizePageSize(999)).toBe(50);
  });

  it("defaults to 20", () => {
    expect(normalizePageSize()).toBe(20);
  });
});
