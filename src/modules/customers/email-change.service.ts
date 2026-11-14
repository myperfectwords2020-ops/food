import { createHash, randomBytes } from "node:crypto";

import { writeAuditLog } from "@/lib/audit/audit-log.service";
import { prisma } from "@/lib/db/prisma";
import { ValidationError } from "@/lib/errors/app-error";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function createEmailChangeToken(userId: string, newEmail: string) {
  const raw = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.emailChangeToken.create({
    data: { userId, newEmail, tokenHash, expiresAt },
  });

  return { token: raw, expiresAt };
}

/** Persists the request and audit trail. Email delivery is handled by the notification layer (Phase later). */
export async function requestEmailChange(input: {
  userId: string;
  tenantId: string;
  customerId: string;
  newEmail: string;
  rawToken: string;
  expiresAt: Date;
}) {
  await writeAuditLog({
    tenantId: input.tenantId,
    actorId: input.userId,
    action: "customer.email_change_requested",
    entityType: "Customer",
    entityId: input.customerId,
    metadata: { newEmail: input.newEmail },
  });

  if (process.env["NODE_ENV"] === "development") {
    console.info(
      `[email-change] Verification token for ${input.newEmail} (expires ${input.expiresAt.toISOString()}). Token not logged.`,
    );
  }

  void input.rawToken;
}

export async function confirmEmailChange(userId: string, rawToken: string) {
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const record = await prisma.emailChangeToken.findFirst({
    where: { userId, tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
  });
  if (!record) throw new ValidationError("Invalid or expired verification link.");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { customer: true },
  });
  if (!user.tenantId || !user.customer) {
    throw new ValidationError("Account cannot be updated.");
  }

  const newEmail = record.newEmail.trim().toLowerCase();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { email: newEmail, emailVerified: new Date() },
    }),
    prisma.customer.update({
      where: { id: user.customer.id },
      data: { email: newEmail },
    }),
    prisma.emailChangeToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  await writeAuditLog({
    tenantId: user.tenantId,
    actorId: userId,
    action: "customer.email_changed",
    entityType: "Customer",
    entityId: user.customer.id,
  });
}
