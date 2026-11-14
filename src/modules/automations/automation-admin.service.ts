import type { Prisma } from "@prisma/client";

import { writeAuditLog } from "@/lib/audit/audit-log.service";
import { prisma } from "@/lib/db/prisma";
import { tenantScopeWhere } from "@/lib/db/tenant-query";
import type { RequestContext } from "@/lib/auth/types";
import { roleHasPermission } from "@/lib/auth/permissions";
import { AuthorizationError, NotFoundError, ValidationError } from "@/lib/errors/app-error";
import {
  assertWorkflowPublishable,
  validateWorkflowDefinition,
} from "@/modules/automations/workflow/workflow-validator";
import {
  workflowFromNodes,
  type StoredWorkflowDefinition,
} from "@/modules/automations/workflow/workflow-definition";
import { normalizeTriggerType } from "@/modules/automations/types/triggers";
import type { AdminAutomation, WorkflowNode } from "@/types/admin";

function requireAutomationPermission(
  context: RequestContext,
  permission: "automations.read" | "automations.manage",
) {
  if (!roleHasPermission(context.role, permission)) throw new AuthorizationError();
}

function mapStatusToAdmin(status: string): AdminAutomation["status"] {
  switch (status) {
    case "ACTIVE":
      return "enabled";
    case "PAUSED":
      return "disabled";
    case "ARCHIVED":
      return "disabled";
    default:
      return "draft";
  }
}

function mapAdminStatusToPrisma(status?: AdminAutomation["status"]) {
  if (status === "enabled") return "ACTIVE" as const;
  if (status === "disabled") return "PAUSED" as const;
  return "DRAFT" as const;
}

function definitionFromRow(definition: unknown, nodes?: WorkflowNode[]): StoredWorkflowDefinition {
  if (nodes?.length) return workflowFromNodes(nodes);
  const raw = definition as StoredWorkflowDefinition;
  if (raw?.version === 1 && Array.isArray(raw.nodes)) return raw;
  return workflowFromNodes([]);
}

function summarizeNodes(nodes: WorkflowNode[]) {
  return nodes.map((n) => n.type).join(" · ");
}

async function runStats(automationId: string) {
  const [executionCount, successCount, failureCount, last] = await Promise.all([
    prisma.automationRun.count({ where: { automationId } }),
    prisma.automationRun.count({ where: { automationId, status: "COMPLETED" } }),
    prisma.automationRun.count({ where: { automationId, status: "FAILED" } }),
    prisma.automationRun.findFirst({
      where: { automationId },
      orderBy: { startedAt: "desc" },
      select: { startedAt: true },
    }),
  ]);
  return {
    executionCount,
    successCount,
    failureCount,
    lastExecutedAt: last?.startedAt.toISOString(),
  };
}

function mapRunStatus(status: string): AdminAutomation["runs"][number]["status"] {
  if (status === "COMPLETED") return "success";
  if (status === "FAILED") return "failure";
  return "running";
}

export async function listAutomationsAdmin(context: RequestContext) {
  requireAutomationPermission(context, "automations.read");
  const tenantId = context.tenantId!;
  const rows = await prisma.automation.findMany({
    where: { ...tenantScopeWhere(tenantId, context.role) },
    orderBy: { updatedAt: "desc" },
  });

  return Promise.all(
    rows.map(async (a) => {
      const stats = await runStats(a.id);
      return {
        id: a.id,
        name: a.name,
        description: a.description ?? "",
        status: mapStatusToAdmin(a.status),
        trigger: a.trigger,
        actionsSummary: summarizeNodes(definitionFromRow(a.definition).nodes),
        ...stats,
      };
    }),
  );
}

export async function getAutomationAdmin(
  context: RequestContext,
  id: string,
): Promise<AdminAutomation | null> {
  requireAutomationPermission(context, "automations.read");
  const tenantId = context.tenantId!;
  const a = await prisma.automation.findFirst({
    where: { id, ...tenantScopeWhere(tenantId, context.role) },
  });
  if (!a) return null;

  const def = definitionFromRow(a.definition);
  const stats = await runStats(a.id);
  const runs = await prisma.automationRun.findMany({
    where: { automationId: a.id },
    orderBy: { startedAt: "desc" },
    take: 25,
  });

  return {
    id: a.id,
    name: a.name,
    description: a.description ?? "",
    status: mapStatusToAdmin(a.status),
    trigger: a.trigger,
    actionsSummary: summarizeNodes(def.nodes),
    ...stats,
    nodes: def.nodes,
    runs: runs.map((r) => ({
      id: r.id,
      status: mapRunStatus(r.status),
      startedAt: r.startedAt.toISOString(),
      finishedAt: r.completedAt?.toISOString(),
      message: r.message ?? r.errorMessage ?? "",
    })),
  };
}

export async function createAutomationAdmin(
  context: RequestContext,
  input: { name: string; description: string; trigger: string; nodes: WorkflowNode[] },
): Promise<AdminAutomation> {
  requireAutomationPermission(context, "automations.manage");
  const tenantId = context.tenantId!;
  const triggerType = normalizeTriggerType(input.trigger);
  if (!triggerType) throw new ValidationError("Unsupported trigger.");

  const definition = workflowFromNodes(
    input.nodes.length >= 2
      ? input.nodes
      : [
          { id: "n-trigger", type: "TRIGGER", title: "Trigger", description: input.trigger },
          { id: "n-end", type: "END", title: "End", description: "Workflow complete" },
        ],
  );

  const row = await prisma.automation.create({
    data: {
      tenantId,
      name: input.name,
      description: input.description,
      trigger: input.trigger,
      triggerType,
      status: "DRAFT",
      definition: definition as unknown as Prisma.InputJsonValue,
      createdByUserId: context.userId ?? null,
      updatedByUserId: context.userId ?? null,
    },
  });

  await writeAuditLog({
    tenantId,
    actorId: context.userId,
    action: "automation.created",
    entityType: "Automation",
    entityId: row.id,
  });

  const created = await getAutomationAdmin(context, row.id);
  return created!;
}

export async function updateAutomationAdmin(
  context: RequestContext,
  id: string,
  input: Partial<Pick<AdminAutomation, "name" | "description" | "trigger" | "status" | "nodes">>,
): Promise<AdminAutomation | null> {
  requireAutomationPermission(context, "automations.manage");
  const tenantId = context.tenantId!;
  const existing = await prisma.automation.findFirst({
    where: { id, ...tenantScopeWhere(tenantId, context.role) },
  });
  if (!existing) return null;

  const trigger = input.trigger ?? existing.trigger;
  const triggerType = normalizeTriggerType(trigger);
  if (!triggerType) throw new ValidationError("Unsupported trigger.");

  const nodes = input.nodes ?? definitionFromRow(existing.definition).nodes;
  const definition = workflowFromNodes(
    nodes.length >= 2 ? nodes : definitionFromRow(existing.definition).nodes,
  );
  const issues = validateWorkflowDefinition(triggerType, definition);
  if (issues.length && input.status !== "draft") {
    throw new ValidationError(issues.map((i) => i.message).join(" "));
  }

  const row = await prisma.automation.update({
    where: { id },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      trigger,
      triggerType,
      definition: definition as unknown as Prisma.InputJsonValue,
      ...(input.status ? { status: mapAdminStatusToPrisma(input.status) } : {}),
      updatedByUserId: context.userId ?? null,
    },
  });

  await writeAuditLog({
    tenantId,
    actorId: context.userId,
    action: "automation.updated",
    entityType: "Automation",
    entityId: id,
  });

  return getAutomationAdmin(context, row.id);
}

export async function publishAutomationAdmin(context: RequestContext, id: string) {
  requireAutomationPermission(context, "automations.manage");
  const tenantId = context.tenantId!;
  const automation = await prisma.automation.findFirst({
    where: { id, ...tenantScopeWhere(tenantId, context.role) },
  });
  if (!automation) throw new NotFoundError("Automation not found.");

  const definition = definitionFromRow(automation.definition);
  assertWorkflowPublishable(automation.triggerType, definition);

  const latestVersion = await prisma.automationVersion.findFirst({
    where: { automationId: id },
    orderBy: { version: "desc" },
  });
  const nextVersion = (latestVersion?.version ?? 0) + 1;

  const versionData: Prisma.AutomationVersionUncheckedCreateInput = {
    tenantId,
    automationId: id,
    version: nextVersion,
    definition: definition as unknown as Prisma.InputJsonValue,
    triggerType: automation.triggerType,
    createdByUserId: context.userId ?? null,
    publishedAt: new Date(),
  };
  if (automation.triggerConfig != null) {
    versionData.triggerConfig = automation.triggerConfig as Prisma.InputJsonValue;
  }
  const version = await prisma.automationVersion.create({ data: versionData });

  await prisma.automation.update({
    where: { id },
    data: {
      status: "ACTIVE",
      activeVersionId: version.id,
      updatedByUserId: context.userId ?? null,
    },
  });

  await writeAuditLog({
    tenantId,
    actorId: context.userId,
    action: "automation.published",
    entityType: "Automation",
    entityId: id,
    metadata: { version: nextVersion },
  });
}

export async function setAutomationEnabledAdmin(
  context: RequestContext,
  id: string,
  enabled: boolean,
) {
  requireAutomationPermission(context, "automations.manage");
  const tenantId = context.tenantId!;
  const automation = await prisma.automation.findFirst({
    where: { id, ...tenantScopeWhere(tenantId, context.role) },
  });
  if (!automation) return false;

  await prisma.automation.update({
    where: { id },
    data: { status: enabled ? "ACTIVE" : "PAUSED", updatedByUserId: context.userId ?? null },
  });

  await writeAuditLog({
    tenantId,
    actorId: context.userId,
    action: enabled ? "automation.resumed" : "automation.paused",
    entityType: "Automation",
    entityId: id,
  });
  return true;
}
