import { ValidationError } from "@/lib/errors/app-error";
import {
  getActionDefinition,
  isKnownActionType,
} from "@/modules/automations/actions/action-registry";
import { parseConditionGroup } from "@/modules/automations/conditions/condition-engine";
import { isRegisteredTrigger, normalizeTriggerType } from "@/modules/automations/types/triggers";

import {
  MAX_WORKFLOW_STEPS,
  parseWorkflowDefinition,
  type StoredWorkflowDefinition,
} from "./workflow-definition";

export type WorkflowValidationIssue = { stepId?: string | undefined; message: string };

export function validateWorkflowDefinition(
  triggerType: string,
  definition: StoredWorkflowDefinition,
): WorkflowValidationIssue[] {
  const issues: WorkflowValidationIssue[] = [];
  const trigger = normalizeTriggerType(triggerType);
  if (!trigger) {
    issues.push({ message: "Unknown or unsupported trigger type." });
    return issues;
  }

  try {
    parseWorkflowDefinition(definition);
  } catch {
    issues.push({ message: "Workflow definition schema is invalid." });
    return issues;
  }

  if (definition.nodes.length > MAX_WORKFLOW_STEPS) {
    issues.push({ message: `Workflow exceeds ${MAX_WORKFLOW_STEPS} steps.` });
  }

  const ids = new Set<string>();
  for (const node of definition.nodes) {
    if (ids.has(node.id)) {
      issues.push({ stepId: node.id, message: "Duplicate step id." });
    }
    ids.add(node.id);
  }

  const first = definition.nodes[0];
  if (!first || first.type !== "TRIGGER") {
    issues.push({ message: "Workflow must start with a TRIGGER step." });
  }

  const last = definition.nodes[definition.nodes.length - 1];
  if (!last || last.type !== "END") {
    issues.push({ message: "Workflow must end with an END step." });
  }

  for (const node of definition.nodes) {
    const config = definition.nodeConfig?.[node.id];
    if (node.type === "CONDITION" && config?.["condition"]) {
      try {
        parseConditionGroup(config["condition"]);
      } catch {
        issues.push({ stepId: node.id, message: "Invalid condition configuration." });
      }
    }
    if (node.type === "ACTION" || node.type === "NOTIFICATION") {
      const actionType = String(config?.["actionType"] ?? node.title)
        .toUpperCase()
        .replace(/\s+/g, "_");
      if (!isKnownActionType(actionType)) {
        issues.push({ stepId: node.id, message: `Unknown action type: ${actionType}` });
      } else {
        const def = getActionDefinition(actionType);
        if (def?.validateConfig) {
          try {
            def.validateConfig(config?.["input"] ?? {});
          } catch (err) {
            issues.push({
              stepId: node.id,
              message: err instanceof ValidationError ? err.message : "Invalid action config.",
            });
          }
        }
      }
    }
    if (node.type === "DELAY") {
      const ms = Number(config?.["delayMs"] ?? 0);
      if (!Number.isFinite(ms) || ms < 0 || ms > 1000 * 60 * 60 * 24 * 30) {
        issues.push({ stepId: node.id, message: "Delay must be between 0 and 30 days." });
      }
    }
  }

  return issues;
}

export function assertWorkflowPublishable(
  triggerType: string,
  definition: StoredWorkflowDefinition,
) {
  const issues = validateWorkflowDefinition(triggerType, definition);
  if (issues.length) {
    throw new ValidationError(issues.map((i) => i.message).join(" "));
  }
}
