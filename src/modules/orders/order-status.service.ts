import type { OrderStatus } from "@prisma/client";

import { writeAuditLog } from "@/lib/audit/audit-log.service";
import { authorize } from "@/lib/auth/authorize-context";
import type { RequestContext } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import { tenantScopeWhere } from "@/lib/db/tenant-query";
import { ConflictError, NotFoundError } from "@/lib/errors/app-error";

const transitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED", "FAILED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  FAILED: [],
  REFUNDED: [],
};

export async function transitionOrderStatus(
  context: RequestContext,
  orderId: string,
  nextStatus: OrderStatus,
) {
  authorize(context, "orders.manage");
  const tenantId = context.tenantId!;

  const order = await prisma.order.findFirst({
    where: { id: orderId, ...tenantScopeWhere(tenantId, context.role) },
  });
  if (!order) throw new NotFoundError();

  const allowed = transitions[order.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new ConflictError(`Cannot transition from ${order.status} to ${nextStatus}.`);
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: nextStatus },
  });

  await writeAuditLog({
    tenantId,
    actorId: context.userId,
    action: "order.status_changed",
    entityType: "Order",
    entityId: orderId,
    metadata: { from: order.status, to: nextStatus },
  });

  return updated;
}
