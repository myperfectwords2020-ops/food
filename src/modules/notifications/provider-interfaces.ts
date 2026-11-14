/** Phase 10 boundaries — no external providers wired in Phase 9. */

export type NotificationSendResult =
  | { ok: true; providerMessageId?: string | undefined }
  | { ok: false; code: string; message: string };

export interface EmailProvider {
  send(input: {
    tenantId: string;
    to: string;
    subject: string;
    bodyText: string;
    bodyHtml?: string | undefined;
  }): Promise<NotificationSendResult>;
}

export interface WhatsAppProvider {
  send(input: { tenantId: string; to: string; body: string }): Promise<NotificationSendResult>;
}

export interface SmsProvider {
  send(input: { tenantId: string; to: string; body: string }): Promise<NotificationSendResult>;
}

export interface NotificationProvider {
  email?: EmailProvider | undefined;
  whatsapp?: WhatsAppProvider | undefined;
  sms?: SmsProvider | undefined;
}
