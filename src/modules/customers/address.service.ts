import { writeAuditLog } from "@/lib/audit/audit-log.service";
import { authorize } from "@/lib/auth/authorize-context";
import type { RequestContext } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";
import {
  assertCustomerOwnsResource,
  getAddressForCustomer,
  getCustomerForUser,
} from "@/modules/customers/customer-access.service";
import { addressInputSchema, type AddressInput } from "@/modules/customers/customer.validation";

function mapAddress(row: {
  id: string;
  label: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  street: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
}) {
  return {
    id: row.id,
    label: row.label ?? "Address",
    firstName: row.firstName ?? "",
    lastName: row.lastName ?? "",
    phone: row.phone ?? "",
    street: row.street,
    line2: row.line2 ?? "",
    city: row.city,
    state: row.state,
    postalCode: row.postalCode ?? "",
    country: row.country,
    isDefault: row.isDefault,
  };
}

async function setDefaultAddressTx(tenantId: string, customerId: string, addressId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.address.updateMany({
      where: { customerId, tenantId, isDefault: true },
      data: { isDefault: false },
    });
    await tx.address.updateMany({
      where: { id: addressId, customerId, tenantId },
      data: { isDefault: true },
    });
  });
}

export async function createCustomerAddress(
  context: RequestContext & { customerId: string },
  raw: AddressInput,
) {
  authorize(context, "addresses.manage_own");
  const parsed = addressInputSchema.parse(raw);
  const customer = await getCustomerForUser(context);
  const tenantId = context.tenantId!;

  const makeDefault = parsed.isDefault ?? customer.addresses.length === 0;

  const created = await prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.address.updateMany({
        where: { customerId: customer.id, tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.address.create({
      data: {
        tenantId,
        customerId: customer.id,
        label: parsed.label ?? null,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        phone: parsed.phone,
        street: parsed.street,
        line2: parsed.line2 ?? null,
        city: parsed.city,
        state: parsed.state,
        postalCode: parsed.postalCode ?? null,
        country: parsed.country,
        isDefault: makeDefault,
      },
    });
  });

  await writeAuditLog({
    tenantId,
    actorId: context.userId,
    action: "customer.address_created",
    entityType: "Address",
    entityId: created.id,
  });

  return mapAddress(created);
}

export async function updateCustomerAddress(
  context: RequestContext & { customerId: string },
  addressId: string,
  raw: AddressInput,
) {
  authorize(context, "addresses.manage_own");
  const parsed = addressInputSchema.parse(raw);
  await getAddressForCustomer(context, addressId);
  const tenantId = context.tenantId!;

  const updated = await prisma.address.update({
    where: { id: addressId },
    data: {
      label: parsed.label ?? null,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      phone: parsed.phone,
      street: parsed.street,
      line2: parsed.line2 ?? null,
      city: parsed.city,
      state: parsed.state,
      postalCode: parsed.postalCode ?? null,
      country: parsed.country,
    },
  });

  if (parsed.isDefault) {
    await setDefaultAddressTx(tenantId, context.customerId, addressId);
  }

  await writeAuditLog({
    tenantId,
    actorId: context.userId,
    action: "customer.address_updated",
    entityType: "Address",
    entityId: addressId,
  });

  const refreshed = await prisma.address.findUniqueOrThrow({ where: { id: addressId } });
  return mapAddress(refreshed);
}

export async function deleteCustomerAddress(
  context: RequestContext & { customerId: string },
  addressId: string,
) {
  authorize(context, "addresses.manage_own");
  await getAddressForCustomer(context, addressId);

  const linkedOrders = await prisma.order.count({ where: { addressId } });
  if (linkedOrders > 0) {
    throw new ValidationError(
      "This address was used for a previous order. Edit it instead of deleting, or add a new address.",
    );
  }

  await prisma.address.delete({ where: { id: addressId } });

  await writeAuditLog({
    tenantId: context.tenantId!,
    actorId: context.userId,
    action: "customer.address_deleted",
    entityType: "Address",
    entityId: addressId,
  });

  return { ok: true as const };
}

export async function setDefaultCustomerAddress(
  context: RequestContext & { customerId: string },
  addressId: string,
) {
  authorize(context, "addresses.manage_own");
  await getAddressForCustomer(context, addressId);
  await setDefaultAddressTx(context.tenantId!, context.customerId, addressId);

  await writeAuditLog({
    tenantId: context.tenantId!,
    actorId: context.userId,
    action: "customer.default_address_changed",
    entityType: "Address",
    entityId: addressId,
  });

  return { ok: true as const };
}

export async function getCustomerAddressOrThrow(
  context: RequestContext & { customerId: string },
  addressId: string,
) {
  const row = await getAddressForCustomer(context, addressId);
  return mapAddress(row);
}

/** Guard for cross-customer address access (tests). */
export async function assertAddressOwnership(
  context: RequestContext & { customerId: string },
  addressCustomerId: string,
) {
  await assertCustomerOwnsResource(context, addressCustomerId);
  if (addressCustomerId !== context.customerId) throw new NotFoundError();
}
