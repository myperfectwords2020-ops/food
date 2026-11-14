import { getEnv } from "@/config/env";

export function getNotificationEnv() {
  const env = getEnv();
  return {
    emailApiKey: process.env["EMAIL_API_KEY"] ?? env.EMAIL_API_KEY,
    emailFromAddress: process.env["EMAIL_FROM_ADDRESS"],
    emailFromName: process.env["EMAIL_FROM_NAME"],
    whatsappApiKey: process.env["WHATSAPP_API_KEY"] ?? env.WHATSAPP_API_KEY,
    whatsappPhoneNumberId: process.env["WHATSAPP_PHONE_NUMBER_ID"],
    whatsappWebhookSecret: process.env["WHATSAPP_WEBHOOK_SECRET"],
  };
}

export function getProviderHealth() {
  const env = getNotificationEnv();
  return {
    email: {
      configured: Boolean(env.emailApiKey && env.emailFromAddress),
      provider: "resend",
    },
    whatsapp: {
      configured: Boolean(env.whatsappApiKey && env.whatsappPhoneNumberId),
      provider: "meta_cloud",
    },
    sms: { configured: false, provider: null },
  };
}
