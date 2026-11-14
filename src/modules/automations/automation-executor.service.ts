import { prisma } from "@/lib/db/prisma";
import { conversationTransactionOptions } from "@/lib/db/transaction-options";
import { logger } from "@/lib/logger/logger";
import { ValidationError } from "@/lib/errors/app-error";
import { getActionDefinition } from "@/modules/automations/actions/action-registry";
import {
  evaluateConditionGroup,
  parseConditionGroup,
} from "@/modules/automations/conditions/condition-engine";
import { enqueueAutomationExecution } from "@/modules/automations/automation-queue";
import { parseWorkflowDefinition } from "@/modules/automations/workflow/workflow-definition";
import { resolveWorkflowContext } from "@/modules/automations/context/workflow-context-resolver";

const MAX_STEPS_PER_RUN = 50;

export async function executeAutomationRun(runId: string, fromStepIndex = 0) {
  const run = await prisma.automationRun.findUnique({
    where: { id: runId },
    include: { automationVersion: true, automation: true },
  });
  if (!run) return;
  if (run.status === "CANCELLED" || run.status === "COMPLETED") return;
  if (run.automation.status !== "ACTIVE") {
    await prisma.automationRun.update({
      where: { id: runId },
      data: { status: "CANCELLED", completedAt: new Date(), message: "Automation not active." },
    });
    return;
  }

  const definition = parseWorkflowDefinition(run.automationVersion.definition);
  const nodes = definition.nodes;
  if (fromStepIndex >= nodes.length) {
    await completeRun(runId);
    return;
  }

  await prisma.automationRun.update({
    where: { id: runId },
    data: { status: "RUNNING", attemptCount: { increment: 1 } },
  });

  const envelope = (run.contextSnapshot ?? {}) as Record<string, unknown>;
  const resolved = await resolveWorkflowContext(run.tenantId, envelope);

  let stepIndex = fromStepIndex;
  let stepsExecuted = 0;

  while (stepIndex < nodes.length && stepsExecuted < MAX_STEPS_PER_RUN) {
    const node = nodes[stepIndex]!;
    const config = definition.nodeConfig?.[node.id] ?? {};

    const existingStep = await prisma.automationStepRun.findFirst({
      where: { automationRunId: runId, stepId: node.id },
    });
    if (existingStep) {
      await prisma.automationStepRun.update({
        where: { id: existingStep.id },
        data: {
          status: "RUNNING",
          startedAt: new Date(),
          attemptCount: { increment: 1 },
          input: config as object,
        },
      });
    } else {
      await prisma.automationStepRun.create({
        data: {
          tenantId: run.tenantId,
          automationRunId: runId,
          stepId: node.id,
          stepType: node.type,
          status: "RUNNING",
          startedAt: new Date(),
          input: config as object,
        },
      });
    }

    try {
      if (node.type === "TRIGGER") {
        // no-op
      } else if (node.type === "CONDITION") {
        const group = parseConditionGroup(config["condition"] ?? { all: [] });
        const pass = evaluateConditionGroup(group, resolved);
        if (!pass) {
          await markStep(runId, node.id, "SKIPPED");
          await completeRun(runId);
          return;
        }
      } else if (node.type === "DELAY") {
        const delayMs = Number(config["delayMs"] ?? 0);
        await prisma.automationRun.update({
          where: { id: runId },
          data: { status: "WAITING", currentStepId: node.id },
        });
        await markStep(runId, node.id, "COMPLETED");
        const queued = await enqueueAutomationExecution(
          { runId, tenantId: run.tenantId, fromStepIndex: stepIndex + 1 },
          delayMs,
        );
        if (!queued) {
          await executeAutomationRun(runId, stepIndex + 1);
        }
        return;
      } else if (node.type === "ACTION" || node.type === "NOTIFICATION") {
        const actionType = String(config["actionType"] ?? "CREATE_INTERNAL_NOTIFICATION")
          .toUpperCase()
          .replace(/\s+/g, "_");
        const action = getActionDefinition(actionType);
        if (!action) throw new ValidationError(`Unknown action ${actionType}`);
        const output = await action.execute(
          {
            tenantId: run.tenantId,
            automationRunId: runId,
            causationId: run.causationId ?? undefined,
            event: envelope,
            resolved,
          },
          (config["input"] as Record<string, unknown>) ?? {},
        );
        const stepRow = await prisma.automationStepRun.findFirst({
          where: { automationRunId: runId, stepId: node.id },
        });
        if (stepRow) {
          await prisma.automationStepRun.update({
            where: { id: stepRow.id },
            data: { status: "COMPLETED", completedAt: new Date(), output: output as object },
          });
        }
      } else if (node.type === "END") {
        await markStep(runId, node.id, "COMPLETED");
        await completeRun(runId);
        return;
      }

      if (node.type === "TRIGGER" || node.type === "CONDITION") {
        await markStep(runId, node.id, "COMPLETED");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Step failed";
      const failedStep = await prisma.automationStepRun.findFirst({
        where: { automationRunId: runId, stepId: node.id },
      });
      if (failedStep) {
        await prisma.automationStepRun.update({
          where: { id: failedStep.id },
          data: {
            status: "FAILED",
            failedAt: new Date(),
            errorMessage: message.slice(0, 500),
            errorCode: err instanceof ValidationError ? "VALIDATION_ERROR" : "UNKNOWN_ERROR",
          },
        });
      }
      await prisma.automationRun.update({
        where: { id: runId },
        data: {
          status: "FAILED",
          failedAt: new Date(),
          errorMessage: message.slice(0, 500),
          message: message.slice(0, 500),
        },
      });
      logger.error(
        "automation_run_failed",
        { tenantId: run.tenantId, operation: runId },
        { error: message },
      );
      return;
    }

    stepIndex += 1;
    stepsExecuted += 1;
    await prisma.automationRun.update({
      where: { id: runId },
      data: { currentStepId: node.id },
    });
  }

  if (stepIndex >= nodes.length) {
    await completeRun(runId);
  }
}

async function markStep(runId: string, stepId: string, status: "COMPLETED" | "SKIPPED") {
  const step = await prisma.automationStepRun.findFirst({
    where: { automationRunId: runId, stepId },
  });
  if (!step) return;
  await prisma.automationStepRun.update({
    where: { id: step.id },
    data: { status, completedAt: new Date() },
  });
}

async function completeRun(runId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.automationRun.update({
      where: { id: runId },
      data: { status: "COMPLETED", completedAt: new Date(), currentStepId: null },
    });
  }, conversationTransactionOptions);
}
