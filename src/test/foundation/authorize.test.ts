import type { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  authorizePermission,
  requireAuthenticatedUser,
  requireTenantAccess,
} from "@/lib/auth/authorize";
import { AuthorizationError, AuthenticationError } from "@/lib/errors/app-error";

const staffUser = {
  id: "u1",
  email: "staff@example.com",
  role: "STAFF" as Role,
  tenantId: "tenant-a",
  status: "ACTIVE" as const,
};

describe("authorize helpers", () => {
  it("requires authentication", () => {
    expect(() => requireAuthenticatedUser(null)).toThrow(AuthenticationError);
  });

  it("blocks suspended users", () => {
    expect(() => requireAuthenticatedUser({ ...staffUser, status: "SUSPENDED" })).toThrow(
      AuthenticationError,
    );
  });

  it("enforces permissions", () => {
    expect(() => authorizePermission(staffUser, "automations.manage")).toThrow(AuthorizationError);
    expect(() => authorizePermission(staffUser, "products.read")).not.toThrow();
  });

  it("enforces tenant access", () => {
    expect(() => requireTenantAccess(staffUser, "tenant-b")).toThrow(AuthorizationError);
    expect(() => requireTenantAccess(staffUser, "tenant-a")).not.toThrow();
  });
});
