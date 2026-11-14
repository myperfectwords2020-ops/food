import type { ConversationStatus, MessageRole, Prisma } from "@prisma/client";

import { writeAuditLog } from "@/lib/audit/audit-log.service";
import { prisma } from "@/lib/db/prisma";
import { conversationTransactionOptions } from "@/lib/db/transaction-options";
import { tenantScopeWhere } from "@/lib/db/tenant-query";
import {
  enqueueDomainEventInTransaction,
  enqueueDomainEventsAfterCommit,
  dispatchDomainEvents,
} from "@/lib/events/domain-event-outbox";
import { DomainEventTypes, type DomainEvent } from "@/lib/events/domain-events";
import type { RequestContext } from "@/lib/auth/types";
import { roleHasPermission, type Permission } from "@/lib/auth/permissions";
import { AuthorizationError, NotFoundError, ValidationError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logger/logger";
import { runIdempotent } from "@/modules/commerce/idempotency.service";
import type { AssistantMessageContent } from "@/types/assistant";

import {
  DEFAULT_MESSAGE_PAGE_SIZE,
  MAX_MESSAGE_BODY_LENGTH,
  adminStatusFilterToPrisma,
  isCustomerVisibleRole,
  prismaMessageRoleToStaff,
  toCustomerConversationStatus,
  type StaffConversationDetailDTO,
  type StaffConversationListItemDTO,
  type StaffMessageDTO,
} from "./conversation-dto";
import {
  assertStatusTransition,
  conversationAcceptsCustomerMessages,
  conversationAcceptsStaffMessages,
  conversationBlocksAiResponses,
  statusAfterAssignment,
  statusAfterHandoffRequest,
} from "./conversation-status";

function sanitizeBody(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) throw new ValidationError("Message cannot be empty.");
  if (trimmed.length > MAX_MESSAGE_BODY_LENGTH) {
    throw new ValidationError("Message is too long.");
  }
  return trimmed;
}

function parseMessageCursor(cursor: string | undefined): { createdAt: Date; id: string } | null {
  if (!cursor) return null;
  const [iso, id] = cursor.split("|");
  if (!iso || !id) return null;
  const createdAt = new Date(iso);
  if (Number.isNaN(createdAt.getTime())) return null;
  return { createdAt, id };
}

function encodeMessageCursor(createdAt: Date, id: string): string {
  return `${createdAt.toISOString()}|${id}`;
}

async function emitInTx(tx: Prisma.TransactionClient, events: DomainEvent[]) {
  for (const event of events) {
    await enqueueDomainEventInTransaction(tx, event);
  }
}

export async function getConversationForTenant(tenantId: string, conversationId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, tenantId },
  });
  if (!conversation) throw new NotFoundError("Conversation not found.");
  return conversation;
}

export async function assertCustomerConversationAccess(
  conversationId: string,
  tenantId: string,
  customerId?: string | null,
) {
  const conversation = await getConversationForTenant(tenantId, conversationId);
  if (conversation.customerId && customerId && conversation.customerId !== customerId) {
    throw new AuthorizationError("Conversation access denied.");
  }
  if (conversation.customerId && !customerId) {
    throw new AuthorizationError("Sign in to continue this conversation.");
  }
  return conversation;
}

function requireStaffPermission(context: RequestContext, permission: Permission) {
  if (!roleHasPermission(context.role, permission)) {
    throw new AuthorizationError();
  }
}

async function assertStaffConversationAccess(context: RequestContext, conversationId: string) {
  requireStaffPermission(context, "conversations.read");
  const tenantId = context.tenantId!;
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, ...tenantScopeWhere(tenantId, context.role) },
  });
  if (!conversation) throw new NotFoundError("Conversation not found.");
  return conversation;
}

async function validateAssignee(tenantId: string, userId: string) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId,
      status: "ACTIVE",
      role: { in: ["STAFF", "ADMIN", "SUPER_ADMIN"] },
    },
    select: { id: true, firstName: true, lastName: true, email: true, role: true },
  });
  if (!user) throw new ValidationError("Invalid assignee.");
  if (!roleHasPermission(user.role, "conversations.reply")) {
    throw new ValidationError("Assignee cannot handle conversations.");
  }
  return user;
}

function mapStaffMessage(row: {
  id: string;
  role: MessageRole;
  body: string;
  createdAt: Date;
  metadata: unknown;
}): StaffMessageDTO {
  const meta = row.metadata as { content?: AssistantMessageContent } | null;
  const text = meta?.content?.type === "text" ? meta.content.text : row.body;
  const slugs =
    meta?.content?.type === "recommendations"
      ? meta.content.products.map((p) => p.slug)
      : undefined;
  return {
    id: row.id,
    role: prismaMessageRoleToStaff(row.role),
    body: text,
    at: row.createdAt.toISOString(),
    ...(slugs?.length ? { recommendedProductSlugs: slugs } : {}),
  };
}

function mapListItem(
  c: Prisma.ConversationGetPayload<{
    include: {
      customer: { select: { email: true; firstName: true; lastName: true } };
      assignedToUser: { select: { firstName: true; lastName: true; email: true } };
    };
  }>,
): StaffConversationListItemDTO {
  const assignedToName = c.assignedToUser
    ? [c.assignedToUser.firstName, c.assignedToUser.lastName].filter(Boolean).join(" ") ||
      c.assignedToUser.email
    : undefined;
  return {
    id: c.id,
    customerName:
      [c.customer?.firstName, c.customer?.lastName].filter(Boolean).join(" ") ||
      c.customer?.email ||
      "Guest",
    customerEmail: c.customer?.email ?? "—",
    channel: "ai_assistant",
    status: toCustomerConversationStatus(c.status),
    subject: c.subject,
    lastMessageAt: c.lastMessageAt.toISOString(),
    contextSummary: c.contextSummary ?? "",
    unreadStaffCount: c.unreadStaffCount,
    handoffRequested: c.status === "HANDOFF_REQUESTED" || Boolean(c.handoffRequestedAt),
    assignedToUserId: c.assignedToUserId ?? undefined,
    assignedToName,
    leadId: c.leadId ?? undefined,
  };
}

export async function createConversation(input: {
  tenantId: string;
  customerId?: string | null;
  leadId?: string | null;
  subject?: string;
  channel?: "AI_ASSISTANT";
}) {
  const events: DomainEvent[] = [];
  const conversation = await prisma.$transaction(async (tx) => {
    const created = await tx.conversation.create({
      data: {
        tenantId: input.tenantId,
        customerId: input.customerId ?? null,
        leadId: input.leadId ?? null,
        channel: input.channel ?? "AI_ASSISTANT",
        status: "ACTIVE",
        subject: input.subject ?? "Skincare assistant",
      },
    });
    events.push({
      type: DomainEventTypes.CONVERSATION_CREATED,
      tenantId: input.tenantId,
      occurredAt: new Date().toISOString(),
      payload: { conversationId: created.id },
    });
    await emitInTx(tx, events);
    return created;
  }, conversationTransactionOptions);
  await dispatchDomainEvents(events);
  logger.info("conversation_created", { tenantId: input.tenantId, operation: conversation.id });
  return conversation;
}

export async function listStaffConversations(
  context: RequestContext,
  filters: {
    q?: string | undefined;
    status?: string | undefined;
    assignedToUserId?: string | undefined;
  },
  page: number,
  pageSize: number,
) {
  requireStaffPermission(context, "conversations.read");
  const tenantId = context.tenantId!;
  const prismaStatus = adminStatusFilterToPrisma(filters.status);
  const where: Prisma.ConversationWhereInput = {
    ...tenantScopeWhere(tenantId, context.role),
    channel: "AI_ASSISTANT",
    ...(prismaStatus ? { status: prismaStatus } : {}),
    ...(filters.assignedToUserId ? { assignedToUserId: filters.assignedToUserId } : {}),
    ...(filters.q
      ? {
          OR: [
            { subject: { contains: filters.q, mode: "insensitive" } },
            { contextSummary: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.conversation.count({ where }),
    prisma.conversation.findMany({
      where,
      include: {
        customer: { select: { email: true, firstName: true, lastName: true } },
        assignedToUser: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { lastMessageAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: rows.map(mapListItem),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getStaffConversationDetail(
  context: RequestContext,
  id: string,
  messageLimit = DEFAULT_MESSAGE_PAGE_SIZE,
): Promise<StaffConversationDetailDTO | null> {
  requireStaffPermission(context, "conversations.read");
  const tenantId = context.tenantId!;
  const c = await prisma.conversation.findFirst({
    where: { id, ...tenantScopeWhere(tenantId, context.role) },
    include: {
      customer: { select: { email: true, firstName: true, lastName: true } },
      assignedToUser: { select: { firstName: true, lastName: true, email: true } },
    },
  });
  if (!c) return null;

  const messages = await prisma.message.findMany({
    where: { tenantId, conversationId: id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: messageLimit + 1,
  });

  const hasMoreMessages = messages.length > messageLimit;
  const pageRows = hasMoreMessages ? messages.slice(0, messageLimit) : messages;
  pageRows.reverse();

  const base = mapListItem(c);
  const nextMessageCursor =
    hasMoreMessages && pageRows[0]
      ? encodeMessageCursor(pageRows[0].createdAt, pageRows[0].id)
      : undefined;

  return {
    ...base,
    messages: pageRows.map(mapStaffMessage),
    hasMoreMessages,
    nextMessageCursor,
  };
}

export async function loadOlderStaffMessages(
  context: RequestContext,
  conversationId: string,
  cursor: string,
  limit = DEFAULT_MESSAGE_PAGE_SIZE,
) {
  await assertStaffConversationAccess(context, conversationId);
  const tenantId = context.tenantId!;
  const parsed = parseMessageCursor(cursor);
  if (!parsed) throw new ValidationError("Invalid message cursor.");

  const rows = await prisma.message.findMany({
    where: {
      tenantId,
      conversationId,
      OR: [
        { createdAt: { lt: parsed.createdAt } },
        { createdAt: parsed.createdAt, id: { lt: parsed.id } },
      ],
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;
  slice.reverse();
  const nextCursor =
    hasMore && slice[0] ? encodeMessageCursor(slice[0].createdAt, slice[0].id) : undefined;

  return {
    messages: slice.map(mapStaffMessage),
    hasMore,
    nextCursor,
  };
}

export async function appendMessage(input: {
  tenantId: string;
  conversationId: string;
  role: MessageRole;
  body: string;
  senderUserId?: string | null;
  senderCustomerId?: string | null;
  content?: AssistantMessageContent;
  metadata?: Record<string, unknown>;
  incrementUnreadCustomer?: boolean;
  incrementUnreadStaff?: boolean;
}) {
  const body = sanitizeBody(input.body);
  const events: DomainEvent[] = [];
  const now = new Date();

  const created = await prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: {
        tenantId: input.tenantId,
        conversationId: input.conversationId,
        role: input.role,
        body,
        senderUserId: input.senderUserId ?? null,
        senderCustomerId: input.senderCustomerId ?? null,
        metadata: {
          ...(input.content ? { content: input.content } : {}),
          ...(input.metadata ?? {}),
        } as Prisma.InputJsonValue,
      },
    });

    const convUpdate: Prisma.ConversationUpdateInput = {
      lastMessageAt: now,
      ...(input.role === "CUSTOMER"
        ? { lastCustomerMessageAt: now, unreadStaffCount: { increment: 1 } }
        : {}),
      ...(input.role === "HUMAN"
        ? { lastStaffMessageAt: now, unreadCustomerCount: { increment: 1 } }
        : {}),
      ...(input.incrementUnreadCustomer ? { unreadCustomerCount: { increment: 1 } } : {}),
      ...(input.incrementUnreadStaff ? { unreadStaffCount: { increment: 1 } } : {}),
    };

    await tx.conversation.update({
      where: { id: input.conversationId },
      data: convUpdate,
    });

    return message;
  }, conversationTransactionOptions);

  events.push({
    type: DomainEventTypes.MESSAGE_CREATED,
    tenantId: input.tenantId,
    occurredAt: now.toISOString(),
    payload: {
      conversationId: input.conversationId,
      messageId: created.id,
      role: input.role,
    },
  });
  await enqueueDomainEventsAfterCommit(events);
  await dispatchDomainEvents(events);
  return created;
}

export async function sendCustomerMessage(input: {
  tenantId: string;
  conversationId: string;
  customerId?: string | null;
  body: string;
  content?: AssistantMessageContent;
  idempotencyKey?: string | undefined;
}) {
  const run = async () => {
    const conversation = await assertCustomerConversationAccess(
      input.conversationId,
      input.tenantId,
      input.customerId ?? null,
    );
    if (!conversationAcceptsCustomerMessages(conversation.status)) {
      throw new ValidationError("This conversation is closed.");
    }
    const row = await appendMessage({
      tenantId: input.tenantId,
      conversationId: input.conversationId,
      role: "CUSTOMER",
      body: input.body,
      senderCustomerId: input.customerId ?? null,
      ...(input.content ? { content: input.content } : {}),
    });
    return { messageId: row.id, status: conversation.status };
  };

  if (input.idempotencyKey) {
    return runIdempotent(
      input.tenantId,
      "conversation.customer_message",
      `${input.conversationId}:${input.idempotencyKey}`,
      run,
    );
  }
  return run();
}

export async function requestHumanHandoff(input: {
  tenantId: string;
  conversationId: string;
  customerId?: string | null;
  reason: string;
  actorUserId?: string | undefined;
}) {
  const conversation = await assertCustomerConversationAccess(
    input.conversationId,
    input.tenantId,
    input.customerId ?? null,
  );
  const to = statusAfterHandoffRequest();
  assertStatusTransition(conversation.status, to);
  const now = new Date();
  const events: DomainEvent[] = [];

  await prisma.$transaction(async (tx) => {
    await tx.conversation.update({
      where: { id: conversation.id },
      data: {
        status: to,
        handoffRequestedAt: now,
        contextSummary: input.reason.slice(0, 500),
      },
    });
    events.push({
      type: DomainEventTypes.CONVERSATION_HANDOFF_REQUESTED,
      tenantId: input.tenantId,
      occurredAt: now.toISOString(),
      payload: { conversationId: conversation.id },
    });
    await emitInTx(tx, events);
  }, conversationTransactionOptions);

  await dispatchDomainEvents(events);
  await writeAuditLog({
    tenantId: input.tenantId,
    actorId: input.actorUserId ?? input.customerId ?? undefined,
    action: "conversation.handoff_requested",
    entityType: "Conversation",
    entityId: conversation.id,
    metadata: { reasonLength: input.reason.length },
  });
  logger.info("conversation_handoff", { tenantId: input.tenantId, operation: conversation.id });
}

export async function assignConversation(
  context: RequestContext,
  conversationId: string,
  assigneeUserId: string,
) {
  if (assigneeUserId === context.userId) {
    requireStaffPermission(context, "conversations.reply");
  } else {
    requireStaffPermission(context, "conversations.assign");
  }
  const tenantId = context.tenantId!;
  const conversation = await assertStaffConversationAccess(context, conversationId);
  const assignee = await validateAssignee(tenantId, assigneeUserId);
  const to = statusAfterAssignment();
  if (conversation.status !== "CLOSED" && conversation.status !== "RESOLVED") {
    assertStatusTransition(conversation.status, to);
  }
  const now = new Date();
  const events: DomainEvent[] = [];

  await prisma.$transaction(async (tx) => {
    await tx.conversation.update({
      where: { id: conversationId },
      data: {
        assignedToUserId: assignee.id,
        assignedAt: now,
        status:
          conversation.status === "CLOSED" || conversation.status === "RESOLVED"
            ? "HUMAN_ASSIGNED"
            : to,
        ...(conversation.status === "CLOSED" ? { closedAt: null } : {}),
        ...(conversation.status === "RESOLVED" ? { resolvedAt: null } : {}),
      },
    });
    events.push({
      type: DomainEventTypes.CONVERSATION_ASSIGNED,
      tenantId,
      occurredAt: now.toISOString(),
      payload: { conversationId, assigneeUserId: assignee.id },
    });
    await emitInTx(tx, events);
  }, conversationTransactionOptions);

  await dispatchDomainEvents(events);
  await writeAuditLog({
    tenantId,
    actorId: context.userId,
    action: "conversation.assigned",
    entityType: "Conversation",
    entityId: conversationId,
    metadata: { assigneeUserId: assignee.id },
  });
}

export async function unassignConversation(context: RequestContext, conversationId: string) {
  requireStaffPermission(context, "conversations.assign");
  const tenantId = context.tenantId!;
  await assertStaffConversationAccess(context, conversationId);
  const now = new Date();
  const events: DomainEvent[] = [];

  await prisma.$transaction(async (tx) => {
    await tx.conversation.update({
      where: { id: conversationId },
      data: { assignedToUserId: null, assignedAt: null },
    });
    events.push({
      type: DomainEventTypes.CONVERSATION_UNASSIGNED,
      tenantId,
      occurredAt: now.toISOString(),
      payload: { conversationId },
    });
    await emitInTx(tx, events);
  }, conversationTransactionOptions);

  await dispatchDomainEvents(events);
  await writeAuditLog({
    tenantId,
    actorId: context.userId,
    action: "conversation.unassigned",
    entityType: "Conversation",
    entityId: conversationId,
  });
}

export async function sendStaffReply(
  context: RequestContext,
  conversationId: string,
  body: string,
  idempotencyKey?: string | undefined,
) {
  requireStaffPermission(context, "conversations.reply");
  const tenantId = context.tenantId!;
  const run = async () => {
    const conversation = await assertStaffConversationAccess(context, conversationId);
    if (!conversationAcceptsStaffMessages(conversation.status)) {
      throw new ValidationError("This conversation is closed.");
    }
    const row = await appendMessage({
      tenantId,
      conversationId,
      role: "HUMAN",
      body,
      senderUserId: context.userId,
    });
    return { messageId: row.id };
  };

  if (idempotencyKey) {
    return runIdempotent(
      tenantId,
      "conversation.staff_message",
      `${conversationId}:${idempotencyKey}`,
      run,
    );
  }
  return run();
}

export async function addInternalNote(
  context: RequestContext,
  conversationId: string,
  body: string,
) {
  requireStaffPermission(context, "conversations.internal_note");
  const tenantId = context.tenantId!;
  await assertStaffConversationAccess(context, conversationId);
  const noteBody = sanitizeBody(body);
  const now = new Date();
  const events: DomainEvent[] = [];

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        tenantId,
        conversationId,
        role: "INTERNAL_NOTE",
        body: noteBody,
        senderUserId: context.userId,
      },
    });
    await tx.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: now },
    });
    events.push({
      type: DomainEventTypes.INTERNAL_NOTE_CREATED,
      tenantId,
      occurredAt: now.toISOString(),
      payload: { conversationId, messageId: created.id },
    });
    await emitInTx(tx, events);
    return created;
  }, conversationTransactionOptions);

  await dispatchDomainEvents(events);
  await writeAuditLog({
    tenantId,
    actorId: context.userId,
    action: "conversation.internal_note",
    entityType: "Conversation",
    entityId: conversationId,
    metadata: { messageId: message.id },
  });
  return { messageId: message.id };
}

async function transitionConversationStatus(
  context: RequestContext,
  conversationId: string,
  to: ConversationStatus,
  permission: Permission,
  auditAction: string,
  eventType: (typeof DomainEventTypes)[keyof typeof DomainEventTypes],
  extraData?: Prisma.ConversationUpdateInput,
) {
  requireStaffPermission(context, permission);
  const tenantId = context.tenantId!;
  const conversation = await assertStaffConversationAccess(context, conversationId);
  assertStatusTransition(conversation.status, to);
  const now = new Date();
  const events: DomainEvent[] = [];

  await prisma.$transaction(async (tx) => {
    await tx.conversation.update({
      where: { id: conversationId },
      data: {
        status: to,
        ...extraData,
      },
    });
    events.push({
      type: eventType,
      tenantId,
      occurredAt: now.toISOString(),
      payload: { conversationId, from: conversation.status, to },
    });
    await emitInTx(tx, events);
  }, conversationTransactionOptions);

  await dispatchDomainEvents(events);
  await writeAuditLog({
    tenantId,
    actorId: context.userId,
    action: auditAction,
    entityType: "Conversation",
    entityId: conversationId,
    metadata: { from: conversation.status, to },
  });
}

export async function resolveConversation(context: RequestContext, conversationId: string) {
  await transitionConversationStatus(
    context,
    conversationId,
    "RESOLVED",
    "conversations.resolve",
    "conversation.resolved",
    DomainEventTypes.CONVERSATION_RESOLVED,
    { resolvedAt: new Date() },
  );
}

export async function closeConversation(context: RequestContext, conversationId: string) {
  await transitionConversationStatus(
    context,
    conversationId,
    "CLOSED",
    "conversations.close",
    "conversation.closed",
    DomainEventTypes.CONVERSATION_CLOSED,
    { closedAt: new Date() },
  );
}

export async function reopenConversation(context: RequestContext, conversationId: string) {
  await transitionConversationStatus(
    context,
    conversationId,
    "ACTIVE",
    "conversations.resolve",
    "conversation.reopened",
    DomainEventTypes.CONVERSATION_REOPENED,
    { resolvedAt: null, closedAt: null },
  );
}

export async function markStaffMessagesRead(context: RequestContext, conversationId: string) {
  requireStaffPermission(context, "conversations.read");
  const tenantId = context.tenantId!;
  await assertStaffConversationAccess(context, conversationId);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.message.updateMany({
      where: {
        tenantId,
        conversationId,
        role: "CUSTOMER",
        readAt: null,
      },
      data: { readAt: now },
    });
    await tx.conversation.update({
      where: { id: conversationId },
      data: { unreadStaffCount: 0 },
    });
  }, conversationTransactionOptions);
}

export async function markCustomerMessagesRead(
  tenantId: string,
  conversationId: string,
  customerId?: string | null,
) {
  await assertCustomerConversationAccess(conversationId, tenantId, customerId ?? null);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.message.updateMany({
      where: {
        tenantId,
        conversationId,
        role: "HUMAN",
        readAt: null,
      },
      data: { readAt: now },
    });
    await tx.conversation.update({
      where: { id: conversationId },
      data: { unreadCustomerCount: 0 },
    });
  }, conversationTransactionOptions);
}

export async function loadCustomerVisibleMessages(
  tenantId: string,
  conversationId: string,
  customerId: string | null | undefined,
  limit: number,
) {
  await assertCustomerConversationAccess(conversationId, tenantId, customerId ?? null);
  const rows = await prisma.message.findMany({
    where: {
      tenantId,
      conversationId,
      role: { in: ["CUSTOMER", "AI", "HUMAN", "SYSTEM"] },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.reverse();
}

export { conversationBlocksAiResponses, isCustomerVisibleRole };
