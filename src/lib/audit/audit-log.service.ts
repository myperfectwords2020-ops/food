import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger/logger";

export type WriteAuditLogInput = {
  tenantId?: string | undefined;
  actorId?: string | undefined;
  action: string;
  entityType: string;
  entityId?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
  ipAddress?: string | undefined;
};

export async function writeAuditLog(input: WriteAuditLogInput) {
  try {
    const data: Prisma.AuditLogUncheckedCreateInput = {
      tenantId: input.tenantId ?? null,
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      ipAddress: input.ipAddress ?? null,
    };
    if (input.metadata !== undefined) {
      data.metadata = input.metadata as Prisma.InputJsonValue;
    }
    await prisma.auditLog.create({ data });
  } catch (err) {
    logger.error(
      "audit_log_write_failed",
      { tenantId: input.tenantId, operation: input.action },
      {
        error: err instanceof Error ? err.message : "unknown",
      },
    );
  }
}
