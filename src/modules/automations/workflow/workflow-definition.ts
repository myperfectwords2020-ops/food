import { z } from "zod";

import type { WorkflowNode } from "@/types/admin";

export const MAX_WORKFLOW_STEPS = 50;

export type StoredWorkflowDefinition = {
  version: 1;
  nodes: WorkflowNode[];
  /** Optional structured config keyed by node id */
  nodeConfig?: Record<string, Record<string, unknown>> | undefined;
};

const nodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["TRIGGER", "CONDITION", "ACTION", "DELAY", "NOTIFICATION", "END"]),
  title: z.string(),
  description: z.string(),
});

export const workflowDefinitionSchema = z.object({
  version: z.literal(1),
  nodes: z.array(nodeSchema).min(2).max(MAX_WORKFLOW_STEPS),
  nodeConfig: z.record(z.string(), z.record(z.string(), z.unknown())).optional(),
});

export function parseWorkflowDefinition(raw: unknown): StoredWorkflowDefinition {
  return workflowDefinitionSchema.parse(raw);
}

export function workflowFromNodes(
  nodes: WorkflowNode[],
  nodeConfig?: Record<string, Record<string, unknown>>,
): StoredWorkflowDefinition {
  return workflowDefinitionSchema.parse({ version: 1, nodes, nodeConfig });
}
