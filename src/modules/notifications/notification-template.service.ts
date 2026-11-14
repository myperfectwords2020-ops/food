import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

const DEFAULTS = [
  {
    key: "order_confirmation",
    name: "Order confirmation",
    channel: "EMAIL" as const,
    subject: "Order {{order.orderNumber}} confirmed",
    body: "Hi {{customer.firstName}},\n\nThank you for your order {{order.orderNumber}}.\nTotal: {{order.total}}\n\n— Élan",
    variables: ["customer.firstName", "order.orderNumber", "order.total"],
  },
];

export async function ensureDefaultNotificationTemplates(tenantId: string) {
  for (const tpl of DEFAULTS) {
    const existing = await prisma.notificationTemplate.findFirst({
      where: { tenantId, key: tpl.key, channel: tpl.channel, status: "ACTIVE" },
    });
    if (existing) continue;
    await prisma.notificationTemplate.create({
      data: {
        tenantId,
        key: tpl.key,
        name: tpl.name,
        channel: tpl.channel,
        subject: tpl.subject,
        body: tpl.body,
        version: 1,
        status: "ACTIVE",
        variables: tpl.variables as Prisma.InputJsonValue,
      },
    });
  }
}
