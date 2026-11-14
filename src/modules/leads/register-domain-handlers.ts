import { DomainEventTypes, onDomainEvent } from "@/lib/events/domain-events";
import { applyCustomerLifecycleForPaidOrder } from "@/modules/leads/customer-lifecycle.service";

let registered = false;

export function registerLeadDomainHandlers() {
  if (registered) return;
  registered = true;

  onDomainEvent(DomainEventTypes.ORDER_PAID, async (event) => {
    const payload = event.payload as {
      orderId?: string;
      customerId?: string;
    };
    if (!payload.orderId) return;

    const { prisma } = await import("@/lib/db/prisma");
    const order = await prisma.order.findFirst({
      where: { id: payload.orderId, tenantId: event.tenantId },
      select: { customerId: true },
    });
    if (!order?.customerId) return;

    await applyCustomerLifecycleForPaidOrder({
      tenantId: event.tenantId,
      orderId: payload.orderId,
      customerId: order.customerId,
      ...(event.correlationId ? { correlationId: event.correlationId } : {}),
    });
  });
}
