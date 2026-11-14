import { DomainEventTypes, onDomainEvent } from "@/lib/events/domain-events";
import { attributeAssistantOrderIfEligible } from "@/modules/analytics/analytics-event.service";
import { prisma } from "@/lib/db/prisma";

let registered = false;

export function registerAnalyticsDomainHandlers() {
  if (registered) return;
  registered = true;

  onDomainEvent(DomainEventTypes.ORDER_PAID, async (event) => {
    const payload = event.payload as { orderId?: string; customerId?: string };
    if (!payload.orderId) return;

    const order = await prisma.order.findFirst({
      where: { id: payload.orderId, tenantId: event.tenantId },
      include: {
        items: { select: { productId: true } },
        customer: { select: { id: true } },
      },
    });
    const customerId = order?.customerId ?? payload.customerId;
    if (!order || !customerId) return;

    const productIds = order.items.map((i) => i.productId).filter((id): id is string => Boolean(id));
    if (productIds.length === 0) return;

    await attributeAssistantOrderIfEligible({
      tenantId: event.tenantId,
      orderId: order.id,
      customerId,
      productIds,
    }).catch(() => undefined);
  });
}
