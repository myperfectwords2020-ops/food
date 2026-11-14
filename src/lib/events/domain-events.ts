import { logger } from "@/lib/logger/logger";

export const DomainEventTypes = {
  CUSTOMER_CREATED: "CUSTOMER_CREATED",
  LEAD_CREATED: "LEAD_CREATED",
  LEAD_QUALIFIED: "LEAD_QUALIFIED",
  LEAD_ASSIGNED: "LEAD_ASSIGNED",
  LEAD_CONVERTED: "LEAD_CONVERTED",
  LEAD_STATUS_CHANGED: "LEAD_STATUS_CHANGED",
  CUSTOMER_LIFECYCLE_CHANGED: "CUSTOMER_LIFECYCLE_CHANGED",
  ORDER_CREATED: "ORDER_CREATED",
  ORDER_PAID: "ORDER_PAID",
  ORDER_SHIPPED: "ORDER_SHIPPED",
  ORDER_DELIVERED: "ORDER_DELIVERED",
  PAYMENT_SUCCEEDED: "PAYMENT_SUCCEEDED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  CONVERSATION_CREATED: "CONVERSATION_CREATED",
  CONVERSATION_HANDOFF_REQUESTED: "CONVERSATION_HANDOFF_REQUESTED",
  CONVERSATION_ASSIGNED: "CONVERSATION_ASSIGNED",
  CONVERSATION_UNASSIGNED: "CONVERSATION_UNASSIGNED",
  MESSAGE_CREATED: "MESSAGE_CREATED",
  CONVERSATION_RESOLVED: "CONVERSATION_RESOLVED",
  CONVERSATION_REOPENED: "CONVERSATION_REOPENED",
  CONVERSATION_CLOSED: "CONVERSATION_CLOSED",
  INTERNAL_NOTE_CREATED: "INTERNAL_NOTE_CREATED",
  CONVERSATION_STATUS_CHANGED: "CONVERSATION_STATUS_CHANGED",
} as const;

export type DomainEventType = (typeof DomainEventTypes)[keyof typeof DomainEventTypes];

export type DomainEvent<TPayload = Record<string, unknown>> = {
  type: DomainEventType;
  tenantId: string;
  occurredAt: string;
  payload: TPayload;
  correlationId?: string | undefined;
};

export type DomainEventHandler = (event: DomainEvent) => void | Promise<void>;

const handlers = new Map<DomainEventType, DomainEventHandler[]>();

export function onDomainEvent(type: DomainEventType, handler: DomainEventHandler) {
  const list = handlers.get(type) ?? [];
  list.push(handler);
  handlers.set(type, list);
}

/** Dispatches in-process; enqueue to BullMQ in workers (Phase 1+). */
export async function emitDomainEvent(event: DomainEvent) {
  logger.info("domain_event", { tenantId: event.tenantId, operation: event.type });
  const list = handlers.get(event.type) ?? [];
  for (const handler of list) {
    try {
      await handler(event);
    } catch (err) {
      logger.error(
        "domain_event_handler_failed",
        { tenantId: event.tenantId, operation: event.type },
        {
          error: err instanceof Error ? err.message : "unknown",
        },
      );
    }
  }
}
