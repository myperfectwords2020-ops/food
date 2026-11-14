import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger/logger";
import type { DomainEvent } from "@/lib/events/domain-events";
import { domainEventToEnvelope } from "@/modules/automations/types/event-envelope";
import { triggerTypeForDomainEvent } from "@/modules/automations/types/triggers";
import { enqueueAutomationExecution } from "@/modules/automations/automation-queue";
import { executeAutomationRun } from "@/modules/automations/automation-executor.service";

const LOOP_PREFIX = "automation:";

export async function processAutomationTriggersForDomainEvent(event: DomainEvent) {
  const triggerType = triggerTypeForDomainEvent(event.type);
  if (!triggerType) return;

  const envelope = domainEventToEnvelope(event);
  if (envelope.causationId?.startsWith(LOOP_PREFIX)) {
    logger.info("automation_loop_guard", { tenantId: event.tenantId, operation: event.type });
    return;
  }

  const automations = await prisma.automation.findMany({
    where: {
      tenantId: event.tenantId,
      status: "ACTIVE",
      triggerType,
      activeVersionId: { not: null },
    },
    include: { activeVersion: true },
  });

  for (const automation of automations) {
    if (!automation.activeVersion) continue;
    try {
      const run = await prisma.automationRun.create({
        data: {
          tenantId: event.tenantId,
          automationId: automation.id,
          automationVersionId: automation.activeVersion.id,
          triggerEventId: envelope.eventId,
          status: "QUEUED",
          correlationId: envelope.correlationId ?? null,
          causationId: envelope.causationId ?? null,
          contextSnapshot: JSON.parse(JSON.stringify(envelope)) as Prisma.InputJsonValue,
          payload: JSON.parse(JSON.stringify(envelope.data)) as Prisma.InputJsonValue,
        },
      });

      const queued = await enqueueAutomationExecution({ runId: run.id, tenantId: run.tenantId });
      if (!queued) {
        await executeAutomationRun(run.id, 0);
      }
    } catch (err) {
      const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
      if (code === "P2002") {
        logger.info("automation_run_deduped", {
          tenantId: event.tenantId,
          operation: automation.id,
        });
        continue;
      }
      logger.error(
        "automation_trigger_failed",
        { tenantId: event.tenantId, operation: automation.id },
        { error: err instanceof Error ? err.message : "unknown" },
      );
    }
  }
}
