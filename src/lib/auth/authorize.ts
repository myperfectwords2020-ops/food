import type { Role, UserStatus } from "@prisma/client";

import { AuthorizationError, AuthenticationError } from "@/lib/errors/app-error";
import { type Permission, roleHasPermission } from "@/lib/auth/permissions";

export type AuthSessionUser = {
  id: string;
  email: string;
  role: Role;
  tenantId: string | null;
  status?: UserStatus;
};

export function requireAuthenticatedUser(
  user: AuthSessionUser | null | undefined,
): AuthSessionUser {
  if (!user) throw new AuthenticationError();
  if (user.status && user.status !== "ACTIVE") {
    throw new AuthenticationError("Account is not active.");
  }
  return user;
}

/** @deprecated use requireAuthenticatedUser */
export const requireAuthenticated = requireAuthenticatedUser;

export function authorizePermission(user: AuthSessionUser, permission: Permission) {
  requireAuthenticatedUser(user);
  if (!roleHasPermission(user.role, permission)) {
    throw new AuthorizationError();
  }
}

/** @deprecated use authorizePermission */
export const requirePermission = authorizePermission;

export function requireRole(user: AuthSessionUser, ...roles: Role[]) {
  requireAuthenticatedUser(user);
  if (!roles.includes(user.role)) {
    throw new AuthorizationError();
  }
}

export function requireTenantAccess(user: AuthSessionUser, tenantId: string) {
  requireAuthenticatedUser(user);
  if (user.role === "SUPER_ADMIN") return;
  if (!user.tenantId || user.tenantId !== tenantId) {
    throw new AuthorizationError("Tenant access denied.");
  }
}

export function requireStaff(user: AuthSessionUser) {
  requireAuthenticatedUser(user);
  if (user.role === "CUSTOMER") {
    throw new AuthorizationError();
  }
}
