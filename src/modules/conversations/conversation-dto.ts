import type { ConversationStatus, MessageRole } from "@prisma/client";

import type { AssistantMessageContent } from "@/types/assistant";

export type CustomerConversationStatus =
  "active" | "handoff_requested" | "human_assigned" | "resolved" | "closed";

export type AdminConversationStatus = CustomerConversationStatus;

export function toCustomerConversationStatus(
  status: ConversationStatus,
): CustomerConversationStatus {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "HANDOFF_REQUESTED":
      return "handoff_requested";
    case "HUMAN_ASSIGNED":
      return "human_assigned";
    case "RESOLVED":
      return "resolved";
    case "CLOSED":
      return "closed";
    default:
      return "active";
  }
}

export function adminStatusFilterToPrisma(
  status: string | undefined,
): ConversationStatus | undefined {
  if (!status) return undefined;
  const map: Record<string, ConversationStatus> = {
    active: "ACTIVE",
    open: "ACTIVE",
    handoff_requested: "HANDOFF_REQUESTED",
    handoff: "HANDOFF_REQUESTED",
    waiting: "HANDOFF_REQUESTED",
    human_assigned: "HUMAN_ASSIGNED",
    resolved: "RESOLVED",
    closed: "CLOSED",
  };
  return map[status.toLowerCase()];
}

export type CustomerMessageDTO = {
  id: string;
  role: "user" | "assistant" | "staff" | "system";
  body: string;
  createdAt: string;
  content?: AssistantMessageContent | undefined;
};

export type CustomerConversationDTO = {
  id: string;
  status: CustomerConversationStatus;
  subject: string;
  lastMessageAt: string;
  unreadCount: number;
};

export type StaffMessageDTO = {
  id: string;
  role: "customer" | "ai" | "human" | "system" | "internal_note";
  body: string;
  at: string;
  recommendedProductSlugs?: string[] | undefined;
};

export type StaffConversationListItemDTO = {
  id: string;
  customerName: string;
  customerEmail: string;
  channel: "ai_assistant";
  status: AdminConversationStatus;
  subject: string;
  lastMessageAt: string;
  contextSummary: string;
  unreadStaffCount: number;
  handoffRequested: boolean;
  assignedToUserId?: string | undefined;
  assignedToName?: string | undefined;
  leadId?: string | undefined;
};

export type StaffConversationDetailDTO = StaffConversationListItemDTO & {
  messages: StaffMessageDTO[];
  hasMoreMessages: boolean;
  nextMessageCursor?: string | undefined;
};

export function prismaMessageRoleToStaff(role: MessageRole): StaffMessageDTO["role"] {
  switch (role) {
    case "CUSTOMER":
      return "customer";
    case "AI":
      return "ai";
    case "HUMAN":
      return "human";
    case "INTERNAL_NOTE":
      return "internal_note";
    default:
      return "system";
  }
}

export function isCustomerVisibleRole(role: MessageRole): boolean {
  return role === "CUSTOMER" || role === "AI" || role === "HUMAN" || role === "SYSTEM";
}

export const MAX_MESSAGE_BODY_LENGTH = 4000;
export const DEFAULT_MESSAGE_PAGE_SIZE = 50;
