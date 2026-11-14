import { writeAuditLog } from "@/lib/audit/audit-log.service";
import { authorize } from "@/lib/auth/authorize-context";
import type { RequestContext } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import { ConflictError, ValidationError } from "@/lib/errors/app-error";
import { getCustomerForUser } from "@/modules/customers/customer-access.service";
import {
  requestEmailChangeSchema,
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/modules/customers/customer.validation";
import {
  createEmailChangeToken,
  requestEmailChange,
} from "@/modules/customers/email-change.service";

export async function updateCustomerProfile(
  context: RequestContext & { customerId: string },
  raw: UpdateProfileInput,
) {
  authorize(context, "profile.update_own");
  const parsed = updateProfileSchema.parse(raw);
  const customer = await getCustomerForUser(context);

  await prisma.$transaction([
    prisma.customer.update({
      where: { id: customer.id },
      data: {
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        phone: parsed.phone,
      },
    }),
    prisma.user.update({
      where: { id: context.userId },
      data: {
        firstName: parsed.firstName,
        lastName: parsed.lastName,
      },
    }),
  ]);

  await writeAuditLog({
    tenantId: context.tenantId!,
    actorId: context.userId,
    action: "customer.profile_updated",
    entityType: "Customer",
    entityId: customer.id,
  });

  return {
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    email: customer.email,
    phone: parsed.phone,
  };
}

export async function requestCustomerEmailChange(
  context: RequestContext & { customerId: string },
  raw: { newEmail: string },
) {
  authorize(context, "profile.update_own");
  const parsed = requestEmailChangeSchema.parse(raw);
  const customer = await getCustomerForUser(context);

  if (parsed.newEmail === customer.email.toLowerCase()) {
    throw new ValidationError("That is already your email address.");
  }

  const taken = await prisma.user.findFirst({
    where: {
      tenantId: context.tenantId!,
      email: parsed.newEmail,
      NOT: { id: context.userId },
    },
    select: { id: true },
  });
  if (taken) throw new ConflictError("That email is already in use.");

  const { token, expiresAt } = await createEmailChangeToken(context.userId, parsed.newEmail);
  await requestEmailChange({
    userId: context.userId,
    tenantId: context.tenantId!,
    customerId: customer.id,
    newEmail: parsed.newEmail,
    rawToken: token,
    expiresAt,
  });

  return {
    ok: true as const,
    message:
      "Verification is required before your email changes. Email delivery depends on the notification service (not yet wired in development).",
  };
}
