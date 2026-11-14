import { cache } from "react";

import { getSessionUser } from "@/lib/auth/index";
import { requireAuthenticatedUser } from "@/lib/auth/authorize";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestContext } from "@/lib/auth/types";
import { AuthenticationError } from "@/lib/errors/app-error";

export type { RequestContext } from "@/lib/auth/types";
export { authorize } from "@/lib/auth/authorize-context";

export const getRequestContext = cache(async (): Promise<RequestContext | null> => {
  const user = await getSessionUser();
  if (!user) return null;

  const customerId =
    user.role === "CUSTOMER"
      ? (user.customerId ?? (await resolveCustomerIdForUser(user.id)))
      : null;

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    permissions: permissionsForRole(user.role),
    customerId,
  };
});

export async function requireRequestContext(): Promise<RequestContext> {
  const ctx = await getRequestContext();
  if (!ctx) throw new AuthenticationError();
  return ctx;
}

export async function requireCustomerRequestContext(): Promise<
  RequestContext & { customerId: string }
> {
  const ctx = await requireRequestContext();
  requireAuthenticatedUser({
    id: ctx.userId,
    email: ctx.email,
    role: ctx.role,
    tenantId: ctx.tenantId,
  });
  if (ctx.role !== "CUSTOMER" || !ctx.customerId) {
    throw new AuthenticationError("Customer account required.");
  }
  return ctx as RequestContext & { customerId: string };
}

async function resolveCustomerIdForUser(userId: string): Promise<string | null> {
  const { prisma } = await import("@/lib/db/prisma");
  const customer = await prisma.customer.findUnique({
    where: { userId },
    select: { id: true },
  });
  return customer?.id ?? null;
}
