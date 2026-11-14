import type { LeadStatus } from "@prisma/client";

import { ValidationError } from "@/lib/errors/app-error";

const TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ["CONTACTED", "QUALIFIED", "UNQUALIFIED", "LOST"],
  CONTACTED: ["QUALIFIED", "UNQUALIFIED", "LOST"],
  QUALIFIED: ["CONVERTED", "LOST"],
  UNQUALIFIED: ["CONTACTED", "QUALIFIED"],
  CONVERTED: [],
  LOST: ["CONTACTED", "QUALIFIED"],
};

export function assertLeadStatusTransition(from: LeadStatus, to: LeadStatus) {
  if (from === to) return;
  const allowed = TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new ValidationError(`Cannot change lead status from ${from} to ${to}.`);
  }
}

export function isTerminalLeadStatus(status: LeadStatus): boolean {
  return status === "CONVERTED";
}
