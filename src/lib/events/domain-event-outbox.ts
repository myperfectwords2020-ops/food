import type { Prisma as PrismaTypes } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { emitDomainEvent, type DomainEvent } from "@/lib/events/domain-events";

export async function enqueueDomainEventInTransaction(
  tx: PrismaTypes.TransactionClient,
  event: DomainEvent,
) {
  await tx.domainEventOutbox.create({
    data: {
      tenantId: event.tenantId,
      type: event.type,
      payload: event.payload as PrismaTypes.InputJsonValue,
      correlationId: event.correlationId ?? null,
    },
  });
}

/** Persist outbox rows after the main transaction commits (shorter interactive tx). */
export async function enqueueDomainEventsAfterCommit(events: DomainEvent[]) {
  for (const event of events) {
    await prisma.domainEventOutbox.create({
      data: {
        tenantId: event.tenantId,
        type: event.type,
        payload: event.payload as PrismaTypes.InputJsonValue,
        correlationId: event.correlationId ?? null,
      },
    });
  }
}

/** Dispatches outbox rows created in the same request (after commit). */
export async function dispatchDomainEvents(events: DomainEvent[]) {
  for (const event of events) {
    await emitDomainEvent(event);
  }
}
