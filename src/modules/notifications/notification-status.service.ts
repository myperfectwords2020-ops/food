import type { NotificationStatus } from "@prisma/client";

import { ValidationError } from "@/lib/errors/app-error";

const TRANSITIONS: Record<NotificationStatus, NotificationStatus[]> = {
  QUEUED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SENT", "FAILED", "CANCELLED"],
  SENT: ["DELIVERED", "FAILED"],
  DELIVERED: [],
  FAILED: [],
  CANCELLED: [],
};

export function assertNotificationStatusTransition(from: NotificationStatus, to: NotificationStatus) {
  if (from === to) return;
  if (!TRANSITIONS[from].includes(to)) {
    throw new ValidationError(`Invalid notification status: ${from} → ${to}`);
  }
}
