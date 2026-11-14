import type { OrderStatus } from "@prisma/client";

import { writeAuditLog } from "@/lib/audit/audit-log.service";
import { authorize } from "@/lib/auth/authorize-context";
import type { RequestContext } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import { tenantScopeWhere } from "@/lib/db/tenant-query";
import { ConflictError, NotFoundError } from "@/lib/errors/app-error";

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED", "FAILED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  FAILED: [],
  REFUNDED: [],
};

/** Next statuses allowed by policy (raw Prisma enum). */
export function allowedNextOrderStatuses(current: OrderStatus): OrderStatus[] {
  return ORDER_STATUS_TRANSITIONS[current] ?? [];
}

const FULFILLMENT_PIPELINE: OrderStatus[] = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

/** Prisma statuses staff may pick in admin (includes skip-ahead on the fulfillment path). */
export function adminSelectableOrderTargets(current: OrderStatus): OrderStatus[] {
  if (current === "PENDING_PAYMENT") {
    return ["CANCELLED"];
  }
  if (current === "DELIVERED" || current === "CANCELLED" || current === "REFUNDED" || current === "FAILED") {
    return [];
  }

  const idx = FULFILLMENT_PIPELINE.indexOf(current);
  const options: OrderStatus[] =
    idx >= 0 ? FULFILLMENT_PIPELINE.slice(idx + 1) : allowedNextOrderStatuses(current);

  const filtered = options.filter((next) => {
    if (current === "PENDING_PAYMENT" && next === "PAID") return false;
    if (next === "FAILED") return false;
    return true;
  });

  if (current !== "CANCELLED" && current !== "DELIVERED" && !filtered.includes("CANCELLED")) {
    filtered.push("CANCELLED");
  }

  return filtered;
}

/** Intermediate Prisma steps from `from` to `to` on the fulfillment path (inclusive of `to`). */
export function fulfillmentTransitionSteps(
  from: OrderStatus,
  to: OrderStatus,
): OrderStatus[] | null {
  if (to === "CANCELLED") {
    return allowedNextOrderStatuses(from).includes("CANCELLED") ? ["CANCELLED"] : null;
  }

  const fromIdx = FULFILLMENT_PIPELINE.indexOf(from);
  const toIdx = FULFILLMENT_PIPELINE.indexOf(to);
  if (fromIdx === -1 || toIdx === -1 || toIdx <= fromIdx) return null;
  return FULFILLMENT_PIPELINE.slice(fromIdx + 1, toIdx + 1);
}

const transitions = ORDER_STATUS_TRANSITIONS;

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

/** Apply one or more fulfillment steps (e.g. paid → shipped walks through processing). */
export async function transitionOrderStatusToTarget(
  context: RequestContext,
  orderId: string,
  targetStatus: OrderStatus,
) {
  authorize(context, "orders.manage");
  const tenantId = context.tenantId!;

  const order = await prisma.order.findFirst({
    where: { id: orderId, ...tenantScopeWhere(tenantId, context.role) },
  });
  if (!order) throw new NotFoundError();

  const steps = fulfillmentTransitionSteps(order.status, targetStatus);
  if (!steps?.length) {
    throw new ConflictError(`Cannot transition from ${order.status} to ${targetStatus}.`);
  }

  let fromStatus = order.status;
  const finalStatus = steps[steps.length - 1]!;

  await prisma.$transaction(async (tx) => {
    for (const step of steps) {
      const allowed = transitions[fromStatus] ?? [];
      if (!allowed.includes(step)) {
        throw new ConflictError(`Cannot transition from ${fromStatus} to ${step}.`);
      }
      await tx.order.update({
        where: { id: orderId },
        data: { status: step },
      });
      fromStatus = step;
    }
  });

  await writeAuditLog({
    tenantId,
    actorId: context.userId,
    action: "order.status_changed",
    entityType: "Order",
    entityId: orderId,
    metadata: {
      from: order.status,
      to: finalStatus,
      steps: steps.join(" → "),
    },
  });

  return prisma.order.findFirst({ where: { id: orderId } });
}
