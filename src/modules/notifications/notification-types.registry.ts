import type { NotificationChannel, NotificationPurpose } from "@prisma/client";

export type NotificationTypeDefinition = {
  type: string;
  purpose: NotificationPurpose;
  channels: NotificationChannel[];
  templateKey: string;
  requiredContext: readonly string[];
};

export const NotificationTypes = {
  WELCOME_EMAIL: {
    type: "WELCOME_EMAIL",
    purpose: "TRANSACTIONAL",
    channels: ["EMAIL", "IN_APP"],
    templateKey: "welcome",
    requiredContext: ["customer"],
  },
  ORDER_CONFIRMATION: {
    type: "ORDER_CONFIRMATION",
    purpose: "TRANSACTIONAL",
    channels: ["EMAIL", "WHATSAPP", "IN_APP"],
    templateKey: "order_confirmation",
    requiredContext: ["customer", "order"],
  },
  PAYMENT_CONFIRMATION: {
    type: "PAYMENT_CONFIRMATION",
    purpose: "TRANSACTIONAL",
    channels: ["EMAIL", "IN_APP"],
    templateKey: "payment_confirmation",
    requiredContext: ["customer", "order"],
  },
  ORDER_SHIPPED: {
    type: "ORDER_SHIPPED",
    purpose: "TRANSACTIONAL",
    channels: ["EMAIL", "WHATSAPP", "IN_APP"],
    templateKey: "order_shipped",
    requiredContext: ["customer", "order"],
  },
  ORDER_DELIVERED: {
    type: "ORDER_DELIVERED",
    purpose: "TRANSACTIONAL",
    channels: ["EMAIL", "IN_APP"],
    templateKey: "order_delivered",
    requiredContext: ["customer", "order"],
  },
  HUMAN_HANDOFF: {
    type: "HUMAN_HANDOFF",
    purpose: "SUPPORT",
    channels: ["EMAIL", "IN_APP"],
    templateKey: "human_handoff",
    requiredContext: ["customer"],
  },
  SUPPORT_REPLY: {
    type: "SUPPORT_REPLY",
    purpose: "SUPPORT",
    channels: ["EMAIL", "IN_APP"],
    templateKey: "support_reply",
    requiredContext: ["customer"],
  },
  LEAD_FOLLOWUP: {
    type: "LEAD_FOLLOWUP",
    purpose: "MARKETING",
    channels: ["EMAIL"],
    templateKey: "lead_followup",
    requiredContext: ["lead"],
  },
} as const satisfies Record<string, NotificationTypeDefinition>;

export type RegisteredNotificationType = keyof typeof NotificationTypes;

export function getNotificationType(type: string): NotificationTypeDefinition | null {
  if (type in NotificationTypes) {
    return NotificationTypes[type as RegisteredNotificationType];
  }
  return null;
}
