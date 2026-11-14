import { getNotificationEnv } from "@/modules/notifications/notification-env";
import type { NotificationSendResult, WhatsAppProvider } from "@/modules/notifications/provider-interfaces";

export function createMetaWhatsAppProvider(): WhatsAppProvider | null {
  const env = getNotificationEnv();
  if (!env.whatsappApiKey || !env.whatsappPhoneNumberId) return null;

  return {
    async send(input) {
      const url = `https://graph.facebook.com/v21.0/${env.whatsappPhoneNumberId}/messages`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.whatsappApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: input.to,
          type: "text",
          text: { body: input.body.slice(0, 4096) },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return {
          ok: false,
          code: res.status === 429 ? "RATE_LIMITED" : res.status >= 500 ? "TRANSIENT_EXTERNAL_ERROR" : "PERMANENT_EXTERNAL_ERROR",
          message: errText.slice(0, 200),
        };
      }

      const data = (await res.json()) as { messages?: { id: string }[] };
      return { ok: true, providerMessageId: data.messages?.[0]?.id };
    },
  };
}
