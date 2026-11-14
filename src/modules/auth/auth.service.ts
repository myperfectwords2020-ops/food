import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";

import type { Role } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { ConflictError, ValidationError } from "@/lib/errors/app-error";
import { writeAuditLog } from "@/lib/audit/audit-log.service";
import { findTenantBySlug } from "@/modules/tenants/tenant.repository";

const BCRYPT_ROUNDS = 12;

export type RegisterCustomerInput = {
  tenantSlug: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | undefined;
};

export async function registerCustomer(input: RegisterCustomerInput) {
  const tenant = await findTenantBySlug(input.tenantSlug);
  if (!tenant) throw new ValidationError("Invalid store.");

  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email },
  });
  if (existing) throw new ConflictError("An account with this email already exists.");

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        tenantId: tenant.id,
        email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: "CUSTOMER",
        status: "ACTIVE",
      },
    });

    const customer = await tx.customer.create({
      data: {
        tenantId: tenant.id,
        userId: createdUser.id,
        email,
        phone: input.phone ?? null,
        firstName: input.firstName,
        lastName: input.lastName,
        lifecycle: "CUSTOMER",
      },
    });

    await tx.customerPreference.create({
      data: { tenantId: tenant.id, customerId: customer.id },
    });

    return createdUser;
  });

  await writeAuditLog({
    tenantId: tenant.id,
    actorId: user.id,
    action: "auth.register",
    entityType: "User",
    entityId: user.id,
  });

  return { userId: user.id };
}

export async function authenticateCredentials(input: {
  tenantSlug: string;
  email: string;
  password: string;
  ipAddress?: string | undefined;
}) {
  const tenant = await findTenantBySlug(input.tenantSlug);
  if (!tenant) return { ok: false as const, reason: "invalid_credentials" as const };

  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email },
  });

  if (!user?.passwordHash) {
    await writeAuditLog({
      tenantId: tenant.id,
      action: "auth.login_failed",
      entityType: "User",
      metadata: { email },
      ipAddress: input.ipAddress,
    });
    return { ok: false as const, reason: "invalid_credentials" as const };
  }

  if (user.status !== "ACTIVE") {
    await writeAuditLog({
      tenantId: tenant.id,
      actorId: user.id,
      action: "auth.login_blocked",
      entityType: "User",
      entityId: user.id,
      ipAddress: input.ipAddress,
    });
    return { ok: false as const, reason: "account_inactive" as const };
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    await writeAuditLog({
      tenantId: tenant.id,
      actorId: user.id,
      action: "auth.login_failed",
      entityType: "User",
      entityId: user.id,
      ipAddress: input.ipAddress,
    });
    return { ok: false as const, reason: "invalid_credentials" as const };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const customer =
    user.role === "CUSTOMER"
      ? await prisma.customer.findUnique({
          where: { userId: user.id },
          select: { id: true },
        })
      : null;

  return {
    ok: true as const,
    user: {
      id: user.id,
      email: user.email,
      name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
      role: user.role as Role,
      tenantId: user.tenantId,
      status: user.status,
      customerId: customer?.id ?? null,
    },
  };
}

export async function createPasswordResetToken(userId: string) {
  const raw = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  await writeAuditLog({
    actorId: userId,
    action: "auth.password_reset_requested",
    entityType: "User",
    entityId: userId,
  });

  return { token: raw, expiresAt };
}

export async function changePasswordForUser(input: {
  userId: string;
  tenantId: string;
  currentPassword: string;
  newPassword: string;
}) {
  const user = await prisma.user.findFirst({
    where: { id: input.userId, tenantId: input.tenantId },
  });
  if (!user?.passwordHash)
    throw new ValidationError("Password sign-in is not enabled for this account.");

  const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!valid) throw new ValidationError("Current password is incorrect.");

  const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  await writeAuditLog({
    tenantId: input.tenantId,
    actorId: user.id,
    action: "auth.password_changed",
    entityType: "User",
    entityId: user.id,
  });
}

export async function deactivateCustomerAccount(input: {
  userId: string;
  tenantId: string;
  customerId: string;
}) {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: input.userId },
      data: { status: "DISABLED" },
    }),
    prisma.customer.update({
      where: { id: input.customerId },
      data: { lifecycle: "VISITOR" },
    }),
  ]);

  await writeAuditLog({
    tenantId: input.tenantId,
    actorId: input.userId,
    action: "customer.account_deactivated",
    entityType: "Customer",
    entityId: input.customerId,
  });
}

export async function consumePasswordResetToken(
  userId: string,
  rawToken: string,
  newPassword: string,
) {
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const record = await prisma.passwordResetToken.findFirst({
    where: { userId, tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
  });
  if (!record) throw new ValidationError("Invalid or expired reset token.");

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  await writeAuditLog({
    actorId: userId,
    action: "auth.password_changed",
    entityType: "User",
    entityId: userId,
  });
}
