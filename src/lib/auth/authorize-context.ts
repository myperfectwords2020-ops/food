import { authorizePermission } from "@/lib/auth/authorize";
import type { Permission } from "@/lib/auth/permissions";
import type { RequestContext } from "@/lib/auth/types";
import { AuthorizationError } from "@/lib/errors/app-error";

export function authorize(context: RequestContext, permission: Permission): void {
  authorizePermission(
    {
      id: context.userId,
      email: context.email,
      role: context.role,
      tenantId: context.tenantId,
    },
    permission,
  );
}

export function authorizeAny(context: RequestContext, ...permissions: Permission[]): void {
  let lastError: AuthorizationError | null = null;
  for (const permission of permissions) {
    try {
      authorize(context, permission);
      return;
    } catch (error) {
      if (error instanceof AuthorizationError) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }
  throw lastError ?? new AuthorizationError();
}
