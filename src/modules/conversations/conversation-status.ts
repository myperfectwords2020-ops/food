import type { ConversationStatus } from "@prisma/client";

import { ValidationError } from "@/lib/errors/app-error";

const TRANSITIONS: Record<ConversationStatus, readonly ConversationStatus[]> = {
  ACTIVE: ["HANDOFF_REQUESTED", "CLOSED", "RESOLVED"],
  HANDOFF_REQUESTED: ["HUMAN_ASSIGNED", "ACTIVE", "CLOSED", "RESOLVED"],
  HUMAN_ASSIGNED: ["RESOLVED", "CLOSED", "HANDOFF_REQUESTED"],
  RESOLVED: ["ACTIVE", "CLOSED"],
  CLOSED: ["ACTIVE"],
};

export function assertStatusTransition(from: ConversationStatus, to: ConversationStatus) {
  if (from === to) return;
  const allowed = TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new ValidationError(`Invalid conversation status transition: ${from} → ${to}.`);
  }
}

export function conversationBlocksAiResponses(status: ConversationStatus): boolean {
  return (
    status === "HANDOFF_REQUESTED" ||
    status === "HUMAN_ASSIGNED" ||
    status === "RESOLVED" ||
    status === "CLOSED"
  );
}

export function conversationAcceptsCustomerMessages(status: ConversationStatus): boolean {
  return status !== "CLOSED";
}

export function conversationAcceptsStaffMessages(status: ConversationStatus): boolean {
  return status !== "CLOSED";
}

export function statusAfterHandoffRequest(): ConversationStatus {
  return "HANDOFF_REQUESTED";
}

export function statusAfterAssignment(): ConversationStatus {
  return "HUMAN_ASSIGNED";
}
