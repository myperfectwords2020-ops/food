import { describe, expect, it } from "vitest";

import { paginateAdminList, parseAdminPage } from "@/lib/admin-list-utils";

describe("admin list utils", () => {
  it("paginates items", () => {
    const result = paginateAdminList([1, 2, 3, 4, 5], 2, 2);
    expect(result.items).toEqual([3, 4]);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(3);
  });

  it("parses page numbers", () => {
    expect(parseAdminPage("2")).toBe(2);
    expect(parseAdminPage(undefined)).toBe(1);
    expect(parseAdminPage("x")).toBe(1);
  });
});
