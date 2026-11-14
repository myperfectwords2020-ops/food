import type { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  canAccessAdminArea,
  isAdminRole,
  isCustomerRole,
  isStaffRole,
  roleHasPermission,
} from "@/lib/auth/permissions";

describe("authorization permissions", () => {
  it("grants staff catalog read but not automation manage", () => {
    expect(roleHasPermission("STAFF" as Role, "products.read")).toBe(true);
    expect(roleHasPermission("STAFF" as Role, "automations.manage")).toBe(false);
  });

  it("grants admin automation and analytics", () => {
    expect(roleHasPermission("ADMIN" as Role, "automations.manage")).toBe(true);
    expect(roleHasPermission("ADMIN" as Role, "analytics.read")).toBe(true);
  });

  it("restricts platform admin to super admin", () => {
    expect(roleHasPermission("SUPER_ADMIN" as Role, "platform.admin")).toBe(true);
    expect(roleHasPermission("ADMIN" as Role, "platform.admin")).toBe(false);
    expect(roleHasPermission("ADMIN" as Role, "tenants.manage")).toBe(false);
  });

  it("grants customer own-order read only to customers", () => {
    expect(roleHasPermission("CUSTOMER" as Role, "orders.read_own")).toBe(true);
    expect(roleHasPermission("STAFF" as Role, "orders.read_own")).toBe(false);
  });

  it("classifies role groups", () => {
    expect(isStaffRole("STAFF" as Role)).toBe(true);
    expect(isCustomerRole("CUSTOMER" as Role)).toBe(true);
    expect(isStaffRole("CUSTOMER" as Role)).toBe(false);
    expect(isAdminRole("ADMIN" as Role)).toBe(true);
    expect(canAccessAdminArea("CUSTOMER" as Role)).toBe(false);
    expect(canAccessAdminArea("STAFF" as Role)).toBe(true);
  });
});
