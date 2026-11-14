import type { NotificationChannel, NotificationPurpose } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export type CanSendInput = {
  tenantId: string;
  customerId?: string | null;
  channel: NotificationChannel;
  purpose: NotificationPurpose;
};

export async function canSendNotification(
  input: CanSendInput,
): Promise<{ allowed: boolean; reason?: string }> {
  if (input.purpose === "TRANSACTIONAL" || input.purpose === "SUPPORT") {
    return { allowed: true };
  }

  if (!input.customerId) {
    return { allowed: false, reason: "Marketing requires a customer." };
  }

  const prefs = await prisma.customerPreference.findFirst({
    where: { tenantId: input.tenantId, customerId: input.customerId },
  });

  if (!prefs) {
    return { allowed: false, reason: "No marketing consent on file." };
  }

  if (input.channel === "EMAIL" && !prefs.emailOffers) {
    return { allowed: false, reason: "Email marketing opt-out." };
  }
  if (input.channel === "WHATSAPP" && !prefs.whatsappOffers) {
    return { allowed: false, reason: "WhatsApp marketing opt-out." };
  }
  if (input.channel === "SMS" && !prefs.smsUpdates) {
    return { allowed: false, reason: "SMS opt-out." };
  }

  return { allowed: true };
}
