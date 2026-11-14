import type { Order, OrderItem, Payment, Address } from "@prisma/client";

import { NotFoundError } from "@/lib/errors/app-error";
import { tenantScopeWhere } from "@/lib/db/tenant-query";
import { authorize } from "@/lib/auth/authorize-context";
import type { RequestContext } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";

export type CustomerOrderDetail = Order & {
  items: OrderItem[];
  payments: Payment[];
  address: Address | null;
};

export async function listOrdersForCustomer(context: RequestContext & { customerId: string }) {
  authorize(context, "orders.read_own");
  return prisma.order.findMany({
    where: {
      customerId: context.customerId,
      ...tenantScopeWhere(context.tenantId, context.role),
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export async function getCustomerOrderById(
  context: RequestContext & { customerId: string },
  orderId: string,
): Promise<CustomerOrderDetail> {
  authorize(context, "orders.read_own");
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      customerId: context.customerId,
      ...tenantScopeWhere(context.tenantId, context.role),
    },
    include: {
      items: true,
      payments: true,
      address: true,
    },
  });
  if (!order) throw new NotFoundError();
  return order;
}

/** Staff tenant-scoped order — enforces tenant, not customer ownership. */
export async function getTenantOrder(context: RequestContext, orderId: string) {
  authorize(context, "orders.read");
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      ...tenantScopeWhere(context.tenantId, context.role),
    },
  });
  if (!order) throw new NotFoundError();
  return order;
}

/** Staff tenant-scoped product — used in isolation tests. */
export async function getTenantProduct(context: RequestContext, productId: string) {
  authorize(context, "products.read");
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      ...tenantScopeWhere(context.tenantId, context.role),
    },
  });
  if (!product) throw new NotFoundError();
  return product;
}

export function canAccessOrder(
  order: { customerId: string | null; tenantId: string },
  context: RequestContext & { customerId: string },
): boolean {
  if (order.tenantId !== context.tenantId) return false;
  if (order.customerId !== context.customerId) return false;
  return true;
}
