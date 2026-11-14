import { describe, expect, it } from "vitest";

import { AuthorizationError } from "@/lib/errors/app-error";
import { assertSameTenant, tenantWhere } from "@/lib/security/tenant-scope";

describe("tenant isolation helpers", () => {
  it("denies cross-tenant access", () => {
    expect(() => assertSameTenant("tenant-a", "tenant-b")).toThrow(AuthorizationError);
  });

  it("allows same tenant", () => {
    expect(() => assertSameTenant("tenant-a", "tenant-a")).not.toThrow();
  });

  it("allows super admin bypass", () => {
    expect(() => assertSameTenant(null, "tenant-b", true)).not.toThrow();
  });

  it("scopes queries to session tenant", () => {
    expect(tenantWhere("tenant-a", false)).toEqual({ tenantId: "tenant-a" });
    expect(tenantWhere("tenant-a", true)).toEqual({});
  });

  it("requires tenant for non-super-admin", () => {
    expect(() => tenantWhere(null, false)).toThrow(AuthorizationError);
  });
});
