import type { DomainEvent } from "@/lib/events/domain-events";

export type AutomationEventEnvelope = {
  eventId: string;
  eventType: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  occurredAt: string;
  causationId?: string | undefined;
  correlationId?: string | undefined;
  data: Record<string, unknown>;
};

export function domainEventToEnvelope(event: DomainEvent): AutomationEventEnvelope {
  const payload = event.payload as Record<string, unknown>;
  const eventId =
    typeof payload["eventId"] === "string"
      ? payload["eventId"]
      : typeof payload["id"] === "string"
        ? payload["id"]
        : crypto.randomUUID();

  const entityId =
    (payload["orderId"] as string | undefined) ??
    (payload["leadId"] as string | undefined) ??
    (payload["customerId"] as string | undefined) ??
    (payload["conversationId"] as string | undefined) ??
    eventId;

  const entityType =
    entityId === (payload["orderId"] as string | undefined)
      ? "Order"
      : entityId === (payload["leadId"] as string | undefined)
        ? "Lead"
        : entityId === (payload["customerId"] as string | undefined)
          ? "Customer"
          : entityId === (payload["conversationId"] as string | undefined)
            ? "Conversation"
            : "Unknown";

  return {
    eventId,
    eventType: event.type,
    tenantId: event.tenantId,
    entityType,
    entityId,
    occurredAt: event.occurredAt,
    correlationId: event.correlationId,
    data: payload,
  };
}
