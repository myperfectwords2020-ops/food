import { createMetaWhatsAppProvider } from "@/modules/notifications/providers/meta-whatsapp.provider";
import { createResendEmailProvider } from "@/modules/notifications/providers/resend-email.provider";
import type { NotificationProvider } from "@/modules/notifications/provider-interfaces";

let cached: NotificationProvider | null = null;

export function getNotificationProviders(): NotificationProvider {
  if (cached) return cached;
  cached = {
    email: createResendEmailProvider() ?? undefined,
    whatsapp: createMetaWhatsAppProvider() ?? undefined,
  };
  return cached;
}
