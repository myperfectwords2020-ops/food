import { DomainEventTypes, onDomainEvent } from "@/lib/events/domain-events";
import { createAndQueueNotification, createInAppNotification } from "@/modules/notifications/notification.service";
import { prisma } from "@/lib/db/prisma";
import { formatNaira } from "@/lib/format";
import { fromMinorUnits } from "@/lib/money";

let registered = false;

export function registerNotificationDomainHandlers() {
  if (registered) return;
  registered = true;

  onDomainEvent(DomainEventTypes.ORDER_PAID, async (event) => {
    const { ensureDefaultNotificationTemplates } = await import(
      "@/modules/notifications/notification-template.service"
    );
    await ensureDefaultNotificationTemplates(event.tenantId);

    const payload = event.payload as { orderId?: string; customerId?: string };
    if (!payload.orderId) return;

    const order = await prisma.order.findFirst({
      where: { id: payload.orderId, tenantId: event.tenantId },
      include: { customer: true },
    });
    if (!order?.customer) return;

    const context = {
      customer: {
        firstName: order.customer.firstName ?? "",
        lastName: order.customer.lastName ?? "",
        email: order.customer.email,
      },
      order: {
        orderNumber: order.orderNumber,
        total: formatNaira(fromMinorUnits(order.totalMinor, order.currency)),
        status: order.status,
      },
      orderId: order.id,
      customerId: order.customerId,
    };

    await createAndQueueNotification({
      tenantId: event.tenantId,
      customerId: order.customerId,
      channel: "EMAIL",
      type: "ORDER_CONFIRMATION",
      recipient: order.customer.email,
      context,
      idempotencyKey: `ORDER_CONFIRMATION:EMAIL:${order.id}`,
    }).catch(() => undefined);

    await createInAppNotification({
      tenantId: event.tenantId,
      customerId: order.customerId!,
      type: "ORDER_CONFIRMATION",
      title: "Order confirmed",
      body: `Your order ${order.orderNumber} is confirmed.`,
      idempotencyKey: `ORDER_CONFIRMATION:IN_APP:${order.id}`,
    }).catch(() => undefined);
  });

  onDomainEvent(DomainEventTypes.CONVERSATION_HANDOFF_REQUESTED, async (event) => {
    const payload = event.payload as { conversationId?: string };
    if (!payload.conversationId) return;
    const conversation = await prisma.conversation.findFirst({
      where: { id: payload.conversationId, tenantId: event.tenantId },
      include: { customer: true },
    });
    if (!conversation?.customerId || !conversation.customer) return;

    await createInAppNotification({
      tenantId: event.tenantId,
      customerId: conversation.customerId,
      type: "HUMAN_HANDOFF",
      title: "Support team notified",
      body: "A specialist will join your conversation shortly.",
      idempotencyKey: `HUMAN_HANDOFF:IN_APP:${conversation.id}`,
    }).catch(() => undefined);
  });
}
