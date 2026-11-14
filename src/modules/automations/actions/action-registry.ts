import { z } from "zod";

import { ValidationError } from "@/lib/errors/app-error";

export type ActionExecutionContext = {
  tenantId: string;
  automationRunId: string;
  causationId?: string | undefined;
  event: Record<string, unknown>;
  resolved: Record<string, unknown>;
};

export type ActionDefinition = {
  type: string;
  description: string;
  permissions: string[];
  validateConfig?: (input: unknown) => void;
  execute: (
    ctx: ActionExecutionContext,
    input: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>;
  retryable: boolean;
};

const internalNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(4000),
  userId: z.string().optional(),
});

const tagSchema = z.object({
  customerId: z.string().min(1),
  tagSlug: z.string().min(1).max(64),
});

const ACTIONS: Record<string, ActionDefinition> = {
  CREATE_INTERNAL_NOTIFICATION: {
    type: "CREATE_INTERNAL_NOTIFICATION",
    description: "Store an internal staff notification",
    permissions: ["automations.manage"],
    validateConfig: (input) => {
      internalNotificationSchema.parse(input);
    },
    retryable: true,
    execute: async (ctx, input) => {
      const data = internalNotificationSchema.parse(input);
      const { prisma } = await import("@/lib/db/prisma");
      const row = await prisma.internalNotification.create({
        data: {
          tenantId: ctx.tenantId,
          userId: data.userId ?? null,
          title: data.title,
          body: data.body,
          resourceType: "AutomationRun",
          resourceId: ctx.automationRunId,
        },
      });
      return { notificationId: row.id };
    },
  },
  ADD_CUSTOMER_TAG: {
    type: "ADD_CUSTOMER_TAG",
    description: "Assign a tenant tag to a customer",
    permissions: ["automations.manage"],
    validateConfig: (input) => tagSchema.parse(input),
    retryable: true,
    execute: async (ctx, input) => {
      const data = tagSchema.parse(input);
      const { prisma } = await import("@/lib/db/prisma");
      const tag = await prisma.customerTag.upsert({
        where: { tenantId_slug: { tenantId: ctx.tenantId, slug: data.tagSlug } },
        create: { tenantId: ctx.tenantId, slug: data.tagSlug, label: data.tagSlug },
        update: {},
      });
      await prisma.customerTagAssignment.upsert({
        where: {
          tenantId_customerId_tagId: {
            tenantId: ctx.tenantId,
            customerId: data.customerId,
            tagId: tag.id,
          },
        },
        create: { tenantId: ctx.tenantId, customerId: data.customerId, tagId: tag.id },
        update: {},
      });
      return { tagId: tag.id };
    },
  },
  CREATE_CONVERSATION_NOTE: {
    type: "CREATE_CONVERSATION_NOTE",
    description: "Add internal conversation note via ConversationService",
    permissions: ["automations.manage"],
    validateConfig: (input) => {
      z.object({ conversationId: z.string(), body: z.string().min(1).max(4000) }).parse(input);
    },
    retryable: false,
    execute: async (ctx, input) => {
      const data = z.object({ conversationId: z.string(), body: z.string() }).parse(input);
      const { addInternalNote } = await import("@/modules/conversations/conversation.service");
      const { requireAutomationStaffContext } =
        await import("@/modules/automations/automation-system-context");
      const staffCtx = await requireAutomationStaffContext(ctx.tenantId);
      const result = await addInternalNote(staffCtx, data.conversationId, data.body);
      return result;
    },
  },
  WAIT: {
    type: "WAIT",
    description: "Delay marker (handled by scheduler)",
    permissions: ["automations.manage"],
    retryable: false,
    execute: async () => ({}),
  },
  SEND_EMAIL: {
    type: "SEND_EMAIL",
    description: "Queue transactional/marketing email via NotificationService",
    permissions: ["automations.manage"],
    validateConfig: (input) => {
      z.object({
        type: z.string(),
        recipient: z.string().email(),
        customerId: z.string().optional(),
        context: z.record(z.string(), z.unknown()).optional(),
      }).parse(input);
    },
    retryable: true,
    execute: async (ctx, input) => {
      const data = z
        .object({
          type: z.string(),
          recipient: z.string().email(),
          customerId: z.string().optional(),
          context: z.record(z.string(), z.unknown()).optional(),
        })
        .parse(input);
      const { createAndQueueNotification } =
        await import("@/modules/notifications/notification.service");
      const result = await createAndQueueNotification({
        tenantId: ctx.tenantId,
        customerId: data.customerId ?? null,
        channel: "EMAIL",
        type: data.type,
        recipient: data.recipient,
        context: { ...(data.context ?? {}), causationId: `automation:${ctx.automationRunId}` },
        idempotencyKey: `auto:${ctx.automationRunId}:email`,
      });
      return result;
    },
  },
  SEND_WHATSAPP: {
    type: "SEND_WHATSAPP",
    description: "Queue WhatsApp via NotificationService",
    permissions: ["automations.manage"],
    validateConfig: (input) => {
      z.object({
        type: z.string(),
        recipient: z.string().min(10),
        customerId: z.string().optional(),
        context: z.record(z.string(), z.unknown()).optional(),
      }).parse(input);
    },
    retryable: true,
    execute: async (ctx, input) => {
      const data = z
        .object({
          type: z.string(),
          recipient: z.string().min(10),
          customerId: z.string().optional(),
          context: z.record(z.string(), z.unknown()).optional(),
        })
        .parse(input);
      const { createAndQueueNotification } =
        await import("@/modules/notifications/notification.service");
      return createAndQueueNotification({
        tenantId: ctx.tenantId,
        customerId: data.customerId ?? null,
        channel: "WHATSAPP",
        type: data.type,
        recipient: data.recipient,
        context: { ...(data.context ?? {}), causationId: `automation:${ctx.automationRunId}` },
        idempotencyKey: `auto:${ctx.automationRunId}:whatsapp`,
      });
    },
  },
  SEND_SMS: {
    type: "SEND_SMS",
    description: "SMS provider (Phase 10)",
    permissions: ["automations.manage"],
    retryable: false,
    execute: async () => {
      throw new ValidationError("SEND_SMS is not configured in this environment.");
    },
  },
};

export function isKnownActionType(type: string): boolean {
  return type in ACTIONS;
}

export function getActionDefinition(type: string): ActionDefinition | undefined {
  return ACTIONS[type.toUpperCase()];
}

export function listActionTypes(): string[] {
  return Object.keys(ACTIONS);
}
