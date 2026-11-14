import type { AuthSessionUser } from "@/lib/auth/authorize";
import { AuthorizationError } from "@/lib/errors/app-error";

export type TenantContext = {
  tenantId: string;
  userId: string;
  role: AuthSessionUser["role"];
};

/** Resolve tenant from authenticated session only — never from the client. */
export function resolveTenantContext(user: AuthSessionUser): TenantContext {
  if (!user.tenantId) {
    throw new AuthorizationError("Tenant context is not available for this user.");
  }
  return { tenantId: user.tenantId, userId: user.id, role: user.role };
}
