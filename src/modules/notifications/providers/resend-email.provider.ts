import { getNotificationEnv } from "@/modules/notifications/notification-env";
import type {
  EmailProvider,
  NotificationSendResult,
} from "@/modules/notifications/provider-interfaces";

export function createResendEmailProvider(): EmailProvider | null {
  const env = getNotificationEnv();
  if (!env.emailApiKey || !env.emailFromAddress) return null;

  return {
    async send(input) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.emailApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.emailFromName
            ? `${env.emailFromName} <${env.emailFromAddress}>`
            : env.emailFromAddress,
          to: [input.to],
          subject: input.subject,
          text: input.bodyText,
          ...(input.bodyHtml ? { html: input.bodyHtml } : {}),
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return {
          ok: false,
          code: res.status >= 500 ? "TRANSIENT_EXTERNAL_ERROR" : "PERMANENT_EXTERNAL_ERROR",
          message: errText.slice(0, 200),
        };
      }

      const data = (await res.json()) as { id?: string };
      return { ok: true, providerMessageId: data.id };
    },
  };
}
