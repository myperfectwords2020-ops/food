import { prisma } from "@/lib/db/prisma";
import type { RequestContext } from "@/lib/auth/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import { NotFoundError } from "@/lib/errors/app-error";

/** Trusted staff context for automation-initiated side effects (not from browser). */
export async function requireAutomationStaffContext(tenantId: string): Promise<RequestContext> {
  const user = await prisma.user.findFirst({
    where: { tenantId, role: { in: ["ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
  });
  if (!user) throw new NotFoundError("No automation operator available for tenant.");
  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId,
    permissions: permissionsForRole(user.role),
    customerId: null,
  };
}
