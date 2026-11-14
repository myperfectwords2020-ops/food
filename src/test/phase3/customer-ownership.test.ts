import type { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { authorizePermission } from "@/lib/auth/authorize";
import { AuthorizationError } from "@/lib/errors/app-error";

describe("customer admin access", () => {
  it("CUSTOMER cannot read admin customers", () => {
    expect(() =>
      authorizePermission(
        {
          id: "cust-user",
          email: "c@test.com",
          role: "CUSTOMER" as Role,
          tenantId: "t1",
          status: "ACTIVE",
        },
        "customers.read",
      ),
    ).toThrow(AuthorizationError);
  });

  it("STAFF can read customers in tenant", () => {
    expect(() =>
      authorizePermission(
        {
          id: "staff-1",
          email: "s@test.com",
          role: "STAFF" as Role,
          tenantId: "t1",
          status: "ACTIVE",
        },
        "customers.read",
      ),
    ).not.toThrow();
  });
});
