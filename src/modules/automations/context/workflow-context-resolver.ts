import { prisma } from "@/lib/db/prisma";

export async function resolveWorkflowContext(
  tenantId: string,
  envelope: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const data = (envelope["data"] as Record<string, unknown> | undefined) ?? envelope;
  const context: Record<string, unknown> = { event: envelope };

  const customerId = data["customerId"] as string | undefined;
  if (customerId) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        lifecycle: true,
      },
    });
    if (customer) {
      context["customer"] = customer;
    }
  }

  const orderId = data["orderId"] as string | undefined;
  if (orderId) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, tenantId },
      select: {
        id: true,
        status: true,
        totalMinor: true,
        currency: true,
        customerId: true,
      },
    });
    if (order) {
      context["order"] = {
        id: order.id,
        status: order.status,
        total: order.totalMinor,
        currency: order.currency,
        customerId: order.customerId,
      };
    }
  }

  const leadId = data["leadId"] as string | undefined;
  if (leadId) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, tenantId },
      select: { id: true, status: true, score: true, customerId: true },
    });
    if (lead) context["lead"] = lead;
  }

  const conversationId = data["conversationId"] as string | undefined;
  if (conversationId) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
      select: { id: true, status: true, customerId: true },
    });
    if (conversation) context["conversation"] = conversation;
  }

  return context;
}
