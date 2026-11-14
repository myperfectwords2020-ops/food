import { NotFoundError } from "@/lib/errors/app-error";
import { tenantScopeWhere } from "@/lib/db/tenant-query";
import { authorize } from "@/lib/auth/authorize-context";
import type { RequestContext } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";

export async function assertCustomerOwnsResource(
  context: RequestContext & { customerId: string },
  resourceCustomerId: string,
) {
  authorize(context, "profile.read_own");
  if (context.customerId !== resourceCustomerId) {
    throw new NotFoundError();
  }
}

export async function getCustomerForUser(context: RequestContext & { customerId: string }) {
  authorize(context, "profile.read_own");
  const customer = await prisma.customer.findFirst({
    where: {
      id: context.customerId,
      userId: context.userId,
      ...tenantScopeWhere(context.tenantId, context.role),
    },
    include: {
      preferences: true,
      addresses: { orderBy: { isDefault: "desc" } },
    },
  });
  if (!customer) throw new NotFoundError();
  return customer;
}

export async function getAddressForCustomer(
  context: RequestContext & { customerId: string },
  addressId: string,
) {
  authorize(context, "addresses.read_own");
  const address = await prisma.address.findFirst({
    where: {
      id: addressId,
      customerId: context.customerId,
      ...tenantScopeWhere(context.tenantId, context.role),
    },
  });
  if (!address) throw new NotFoundError();
  return address;
}

/** Staff/tenant scoped customer lookup — not customer-self. */
export async function getCustomerInTenant(context: RequestContext, customerId: string) {
  authorize(context, "customers.read");
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      ...tenantScopeWhere(context.tenantId, context.role),
    },
  });
  if (!customer) throw new NotFoundError();
  return customer;
}
