import type { NotificationChannel, Prisma } from "@prisma/client";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit/audit-log.service";
import { prisma } from "@/lib/db/prisma";
import { ValidationError } from "@/lib/errors/app-error";
import { runIdempotent } from "@/modules/commerce/idempotency.service";
import { canSendNotification } from "@/modules/notifications/communication-preference.service";
import { enqueueNotificationDelivery } from "@/modules/notifications/notification-queue";
import { processNotificationDelivery } from "@/modules/notifications/notification-delivery.service";
import { getNotificationType } from "@/modules/notifications/notification-types.registry";

const emailSchema = z.string().email();

export type CreateNotificationInput = {
  tenantId: string;
  customerId?: string | null;
  userId?: string | null;
  channel: NotificationChannel;
  type: string;
  recipient: string;
  subject?: string | null;
  context: Record<string, unknown>;
  idempotencyKey?: string | undefined;
  templateKey?: string | undefined;
  scheduledAt?: Date | undefined;
};

function buildIdempotencyKey(input: CreateNotificationInput): string {
  if (input.idempotencyKey) return input.idempotencyKey;
  const entityId =
    (input.context["orderId"] as string | undefined) ??
    (input.context["conversationId"] as string | undefined) ??
    input.customerId ??
    "general";
  return `${input.type}:${input.channel}:${entityId}:${input.customerId ?? "anon"}`;
}

async function resolveActiveTemplate(
  tenantId: string,
  templateKey: string,
  channel: NotificationChannel,
) {
  return prisma.notificationTemplate.findFirst({
    where: { tenantId, key: templateKey, channel, status: "ACTIVE" },
    orderBy: { version: "desc" },
  });
}

export async function createAndQueueNotification(input: CreateNotificationInput) {
  const def = getNotificationType(input.type);
  if (!def) throw new ValidationError("Unknown notification type.");

  if (!def.channels.includes(input.channel)) {
    throw new ValidationError(`Channel ${input.channel} not supported for ${input.type}.`);
  }

  const consent = await canSendNotification({
    tenantId: input.tenantId,
    customerId: input.customerId ?? null,
    channel: input.channel,
    purpose: def.purpose,
  });
  if (!consent.allowed) {
    throw new ValidationError(consent.reason ?? "Communication not permitted.");
  }

  if (input.channel === "EMAIL") {
    const parsed = emailSchema.safeParse(input.recipient);
    if (!parsed.success) throw new ValidationError("Invalid email recipient.");
  }

  const templateKey = input.templateKey ?? def.templateKey;
  const template = await resolveActiveTemplate(input.tenantId, templateKey, input.channel);

  const idempotencyKey = buildIdempotencyKey(input);

  const run = async () => {
    const created = await prisma.notification.create({
      data: {
        tenantId: input.tenantId,
        customerId: input.customerId ?? null,
        userId: input.userId ?? null,
        channel: input.channel,
        type: input.type,
        purpose: def.purpose,
        status: "QUEUED",
        templateId: template?.id ?? null,
        templateVersion: template?.version ?? null,
        recipient: input.recipient,
        subject: input.subject ?? template?.subject ?? null,
        payload: input.context as Prisma.InputJsonValue,
        idempotencyKey,
        scheduledAt: input.scheduledAt ?? null,
      },
    });

    const queued = await enqueueNotificationDelivery({
      notificationId: created.id,
      tenantId: created.tenantId,
    });
    if (!queued) {
      await processNotificationDelivery(created.id);
    }

    return { notificationId: created.id };
  };

  try {
    return await runIdempotent(input.tenantId, "notification.send", idempotencyKey, run);
  } catch (err) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      const existing = await prisma.notification.findFirst({
        where: { tenantId: input.tenantId, idempotencyKey },
      });
      if (existing) return { notificationId: existing.id };
    }
    throw err;
  }
}

export async function listCustomerNotifications(
  tenantId: string,
  customerId: string,
  page: number,
  pageSize: number,
) {
  const [total, rows] = await Promise.all([
    prisma.notification.count({
      where: { tenantId, customerId, channel: "IN_APP" },
    }),
    prisma.notification.findMany({
      where: { tenantId, customerId, channel: "IN_APP" },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.subject ?? n.type.replaceAll("_", " "),
      body: String((n.payload as { bodyText?: string }).bodyText ?? ""),
      read: Boolean(n.readAt),
      createdAt: n.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function markNotificationRead(tenantId: string, customerId: string, id: string) {
  const row = await prisma.notification.findFirst({
    where: { id, tenantId, customerId, channel: "IN_APP" },
  });
  if (!row) throw new ValidationError("Notification not found.");
  await prisma.notification.update({
    where: { id },
    data: { readAt: new Date(), status: row.status === "SENT" ? "DELIVERED" : row.status },
  });
}

export async function markAllNotificationsRead(tenantId: string, customerId: string) {
  await prisma.notification.updateMany({
    where: { tenantId, customerId, channel: "IN_APP", readAt: null },
    data: { readAt: new Date() },
  });
}

export async function createInAppNotification(input: {
  tenantId: string;
  customerId: string;
  type: string;
  title: string;
  body: string;
  idempotencyKey?: string | undefined;
}) {
  return createAndQueueNotification({
    tenantId: input.tenantId,
    customerId: input.customerId,
    channel: "IN_APP",
    type: input.type,
    recipient: input.customerId,
    subject: input.title,
    context: { bodyText: input.body },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function auditNotificationAction(
  tenantId: string,
  actorId: string | undefined,
  action: string,
  entityId: string,
  metadata?: Record<string, unknown>,
) {
  await writeAuditLog({
    tenantId,
    actorId,
    action,
    entityType: "Notification",
    entityId,
    metadata,
  });
}
