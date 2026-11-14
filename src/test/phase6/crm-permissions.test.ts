import { describe, expect, it } from "vitest";

import { roleHasPermission } from "@/lib/auth/permissions";

describe("CRM permissions", () => {
  it("allows staff to read leads", () => {
    expect(roleHasPermission("STAFF", "crm.leads.read")).toBe(true);
  });

  it("blocks customers from admin CRM", () => {
    expect(roleHasPermission("CUSTOMER", "crm.leads.read")).toBe(false);
    expect(roleHasPermission("CUSTOMER", "crm.leads.convert")).toBe(false);
  });

  it("restricts assign to admin roles", () => {
    expect(roleHasPermission("STAFF", "crm.leads.assign")).toBe(false);
    expect(roleHasPermission("ADMIN", "crm.leads.assign")).toBe(true);
  });
});
