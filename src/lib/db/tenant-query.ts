import type { Role } from "@prisma/client";

import { AuthorizationError } from "@/lib/errors/app-error";

/** Build a Prisma `where` fragment — never pass client-supplied tenantId. */
export function tenantScopeWhere(
  sessionTenantId: string | null,
  role: Role,
): { tenantId: string } | Record<string, never> {
  if (role === "SUPER_ADMIN") {
    return {};
  }
  if (!sessionTenantId) {
    throw new AuthorizationError("Tenant context required.");
  }
  return { tenantId: sessionTenantId };
}

export function requireTenantId(sessionTenantId: string | null, role: Role): string {
  if (role === "SUPER_ADMIN") {
    throw new AuthorizationError("Select a tenant context for this operation.");
  }
  if (!sessionTenantId) {
    throw new AuthorizationError("Tenant context required.");
  }
  return sessionTenantId;
}
