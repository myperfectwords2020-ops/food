import { AuthorizationError } from "@/lib/errors/app-error";

/** Never trust tenantId from the client — compare resource tenant to session tenant. */
export function assertSameTenant(
  sessionTenantId: string | null,
  resourceTenantId: string,
  isSuperAdmin = false,
) {
  if (isSuperAdmin) return;
  if (!sessionTenantId || sessionTenantId !== resourceTenantId) {
    throw new AuthorizationError("Cross-tenant access denied.");
  }
}

export function tenantWhere<T extends { tenantId: string }>(
  sessionTenantId: string | null,
  isSuperAdmin: boolean,
): { tenantId: string } | Record<string, never> {
  if (isSuperAdmin) return {};
  if (!sessionTenantId) throw new AuthorizationError("Tenant context required.");
  return { tenantId: sessionTenantId };
}
