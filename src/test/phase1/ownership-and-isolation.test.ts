import type { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { authorizePermission } from "@/lib/auth/authorize";
import { AuthorizationError } from "@/lib/errors/app-error";
import { canAccessOrder } from "@/modules/orders/order-access.service";

function customerContext(id: string, customerId: string, tenantId: string) {
  return {
    id,
    email: `${id}@test.com`,
    role: "CUSTOMER" as Role,
    tenantId,
    status: "ACTIVE" as const,
    customerId,
  };
}

describe("customer ownership", () => {
  it("denies order access when customerId differs (BOLA/IDOR)", () => {
    const ctx = customerContext("user-a", "cust-a", "tenant-1");
    const allowed = canAccessOrder(
      { customerId: "cust-b", tenantId: "tenant-1" },
      {
        userId: ctx.id,
        email: ctx.email,
        role: ctx.role,
        tenantId: ctx.tenantId,
        permissions: [],
        customerId: ctx.customerId,
      },
    );
    expect(allowed).toBe(false);
  });

  it("denies order access across tenants", () => {
    const ctx = customerContext("user-a", "cust-a", "tenant-1");
    expect(
      canAccessOrder(
        { customerId: "cust-a", tenantId: "tenant-2" },
        {
          userId: ctx.id,
          email: ctx.email,
          role: ctx.role,
          tenantId: ctx.tenantId,
          permissions: [],
          customerId: ctx.customerId,
        },
      ),
    ).toBe(false);
  });

  it("allows own order in tenant", () => {
    const ctx = customerContext("user-a", "cust-a", "tenant-1");
    expect(
      canAccessOrder(
        { customerId: "cust-a", tenantId: "tenant-1" },
        {
          userId: ctx.id,
          email: ctx.email,
          role: ctx.role,
          tenantId: ctx.tenantId,
          permissions: [],
          customerId: ctx.customerId,
        },
      ),
    ).toBe(true);
  });
});

describe("privilege escalation guards", () => {
  const staffUser = {
    id: "staff-1",
    email: "staff@test.com",
    role: "STAFF" as Role,
    tenantId: "tenant-1",
    status: "ACTIVE" as const,
  };

  it("customer cannot authorize admin product read", () => {
    const customer = customerContext("user-a", "cust-a", "tenant-1");
    expect(() => authorizePermission(customer, "products.read")).toThrow(AuthorizationError);
  });

  it("staff cannot authorize tenant management", () => {
    expect(() => authorizePermission(staffUser, "tenants.manage")).toThrow(AuthorizationError);
  });

  it("admin cannot authorize super-admin platform operations", () => {
    const admin = { ...staffUser, role: "ADMIN" as Role };
    expect(() => authorizePermission(admin, "platform.admin")).toThrow(AuthorizationError);
  });
});

describe("client identity must not drive authorization", () => {
  it("forged role in a hand-built object is why context must come from session only", () => {
    const customer = customerContext("user-a", "cust-a", "tenant-1");
    expect(() => authorizePermission(customer, "tenants.manage")).toThrow(AuthorizationError);

    const forged = { ...customer, role: "SUPER_ADMIN" as Role };
    expect(() => authorizePermission(forged, "tenants.manage")).not.toThrow();
  });
});
