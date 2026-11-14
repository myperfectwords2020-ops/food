import type { LeadLifecycleStage, OrderStatus } from "@prisma/client";

import { writeAuditLog } from "@/lib/audit/audit-log.service";
import { DomainEventTypes, emitDomainEvent } from "@/lib/events/domain-events";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger/logger";

const QUALIFYING_ORDER_STATUSES: OrderStatus[] = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

export async function applyCustomerLifecycleForPaidOrder(input: {
  tenantId: string;
  orderId: string;
  customerId: string;
  correlationId?: string | undefined;
}) {
  const paidCount = await prisma.order.count({
    where: {
      tenantId: input.tenantId,
      customerId: input.customerId,
      status: { in: QUALIFYING_ORDER_STATUSES },
    },
  });

  if (paidCount === 0) return;

  const customer = await prisma.customer.findFirst({
    where: { id: input.customerId, tenantId: input.tenantId },
    select: { id: true, lifecycle: true },
  });
  if (!customer) return;

  let next: LeadLifecycleStage | null = null;
  if (
    paidCount === 1 &&
    customer.lifecycle !== "CUSTOMER" &&
    customer.lifecycle !== "REPEAT_CUSTOMER"
  ) {
    next = "CUSTOMER";
  } else if (paidCount >= 2 && customer.lifecycle !== "REPEAT_CUSTOMER") {
    next = "REPEAT_CUSTOMER";
  }

  if (!next) return;

  await prisma.customer.update({
    where: { id: customer.id },
    data: { lifecycle: next },
  });

  await writeAuditLog({
    tenantId: input.tenantId,
    action: "CUSTOMER_LIFECYCLE_CHANGED",
    entityType: "Customer",
    entityId: customer.id,
    metadata: { from: customer.lifecycle, to: next, orderId: input.orderId, paidCount },
  });

  await emitDomainEvent({
    type: DomainEventTypes.CUSTOMER_LIFECYCLE_CHANGED,
    tenantId: input.tenantId,
    occurredAt: new Date().toISOString(),
    correlationId: input.correlationId ?? input.orderId,
    payload: {
      customerId: customer.id,
      from: customer.lifecycle,
      to: next,
      orderId: input.orderId,
      paidOrderCount: paidCount,
    },
  });

  logger.info("customer_lifecycle_updated", {
    tenantId: input.tenantId,
    operation: "lifecycle",
  });
}

export async function bumpCustomerLifecycleOnLeadQualified(input: {
  tenantId: string;
  customerId: string;
}) {
  const customer = await prisma.customer.findFirst({
    where: { id: input.customerId, tenantId: input.tenantId },
    select: { id: true, lifecycle: true },
  });
  if (!customer) return;
  if (customer.lifecycle === "CUSTOMER" || customer.lifecycle === "REPEAT_CUSTOMER") return;
  if (customer.lifecycle === "QUALIFIED") return;

  await prisma.customer.update({
    where: { id: customer.id },
    data: { lifecycle: "QUALIFIED" },
  });
}

export async function bumpCustomerLifecycleOnLeadCreated(input: {
  tenantId: string;
  customerId: string;
}) {
  const customer = await prisma.customer.findFirst({
    where: { id: input.customerId, tenantId: input.tenantId },
    select: { id: true, lifecycle: true },
  });
  if (!customer || customer.lifecycle !== "VISITOR") return;

  await prisma.customer.update({
    where: { id: customer.id },
    data: { lifecycle: "LEAD" },
  });
}
