import type { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { AuthorizationError } from "@/lib/errors/app-error";
import { requireTenantId, tenantScopeWhere } from "@/lib/db/tenant-query";

describe("tenant query scoping", () => {
  it("scopes non-super-admin queries", () => {
    expect(tenantScopeWhere("tenant-a", "STAFF" as Role)).toEqual({ tenantId: "tenant-a" });
  });

  it("allows super admin unscoped reads", () => {
    expect(tenantScopeWhere("tenant-a", "SUPER_ADMIN" as Role)).toEqual({});
  });

  it("requires tenant for operational roles", () => {
    expect(() => tenantScopeWhere(null, "ADMIN" as Role)).toThrow(AuthorizationError);
    expect(() => requireTenantId(null, "STAFF" as Role)).toThrow(AuthorizationError);
  });
});
