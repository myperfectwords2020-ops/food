import type { NotificationChannel } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger/logger";
import { assertNotificationStatusTransition } from "@/modules/notifications/notification-status.service";
import { getNotificationProviders } from "@/modules/notifications/provider-factory";
import { renderTemplate } from "@/modules/notifications/template-render.service";
import { normalizePhoneNumber } from "@/modules/notifications/phone.util";
import type { NotificationSendResult } from "@/modules/notifications/provider-interfaces";

export async function processNotificationDelivery(notificationId: string) {
  const row = await prisma.notification.findUnique({
    where: { id: notificationId },
    include: { template: true },
  });
  if (!row) return;
  if (row.status !== "QUEUED" && row.status !== "PROCESSING") return;

  assertNotificationStatusTransition(row.status, "PROCESSING");
  await prisma.notification.update({
    where: { id: notificationId },
    data: { status: "PROCESSING" },
  });

  const context = row.payload as Record<string, unknown>;
  const providers = getNotificationProviders();

  try {
    if (row.channel === "IN_APP") {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: "DELIVERED", deliveredAt: new Date(), sentAt: new Date() },
      });
      return;
    }

    if (row.channel === "EMAIL") {
      const email = providers.email;
      if (!email) throw new Error("EMAIL_NOT_CONFIGURED");
      const rendered = row.template
        ? renderTemplate(
            { subject: row.subject ?? row.template.subject, body: row.template.body },
            context,
            { html: true },
          )
        : {
            subject: row.subject ?? "Notification",
            bodyText: String(context["bodyText"] ?? ""),
            bodyHtml: undefined,
          };
      const result = await email.send({
        tenantId: row.tenantId,
        to: row.recipient,
        subject: rendered.subject ?? "Notification",
        bodyText: rendered.bodyText,
        ...(rendered.bodyHtml ? { bodyHtml: rendered.bodyHtml } : {}),
      });
      await applyProviderResult(notificationId, row.channel, result);
      return;
    }

    if (row.channel === "WHATSAPP") {
      const wa = providers.whatsapp;
      if (!wa) throw new Error("WHATSAPP_NOT_CONFIGURED");
      const phone = normalizePhoneNumber(row.recipient);
      if (!phone) throw new Error("INVALID_PHONE");
      const body = row.template
        ? renderTemplate({ body: row.template.body }, context).bodyText
        : String(context["bodyText"] ?? "");
      const result = await wa.send({ tenantId: row.tenantId, to: phone, body });
      await applyProviderResult(notificationId, row.channel, result);
      return;
    }

    throw new Error("CHANNEL_UNSUPPORTED");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delivery failed";
    const permanent = [
      "EMAIL_NOT_CONFIGURED",
      "WHATSAPP_NOT_CONFIGURED",
      "INVALID_PHONE",
      "CHANNEL_UNSUPPORTED",
    ].includes(message);
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: "FAILED",
        failedAt: new Date(),
        failureCode: permanent ? "PERMANENT_EXTERNAL_ERROR" : "TRANSIENT_EXTERNAL_ERROR",
        failureReason: message.slice(0, 500),
      },
    });
    logger.error(
      "notification_delivery_failed",
      { tenantId: row.tenantId, operation: notificationId },
      { error: message },
    );
    if (!permanent) throw err;
  }
}

async function applyProviderResult(
  notificationId: string,
  channel: NotificationChannel,
  result: NotificationSendResult,
) {
  if (result.ok) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: "SENT",
        sentAt: new Date(),
        provider: channel === "EMAIL" ? "resend" : "meta_whatsapp",
        providerMessageId: result.providerMessageId ?? null,
      },
    });
    return;
  }
  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      status: "FAILED",
      failedAt: new Date(),
      failureCode: result.code ?? "UNKNOWN_ERROR",
      failureReason: result.message?.slice(0, 500) ?? "Provider error",
    },
  });
}
