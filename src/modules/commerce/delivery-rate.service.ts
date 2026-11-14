import { authorize } from "@/lib/auth/authorize-context";
import type { RequestContext } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import { ValidationError } from "@/lib/errors/app-error";
import {
  NIGERIA_STATES,
  normalizeNigeriaStateCode,
  nigeriaStateName,
  type NigeriaStateCode,
} from "@/lib/geo/nigeria-states";
import { STANDARD_DELIVERY_MINOR } from "@/modules/commerce/commerce.constants";

function assertDeliveryRateModel() {
  if (!("deliveryStateRate" in prisma) || !prisma.deliveryStateRate) {
    throw new ValidationError(
      "Delivery rates are unavailable. Run npx prisma generate and restart the dev server.",
    );
  }
}

export type DeliveryRateRow = {
  stateCode: NigeriaStateCode;
  stateName: string;
  deliveryMinor: number;
  enabled: boolean;
};

/** Seeds missing state rows once (single round-trip), not 37 upserts per request. */
export async function ensureDefaultDeliveryRatesForTenant(tenantId: string) {
  assertDeliveryRateModel();
  const existing = await prisma.deliveryStateRate.count({ where: { tenantId } });
  if (existing >= NIGERIA_STATES.length) return;

  await prisma.deliveryStateRate.createMany({
    data: NIGERIA_STATES.map((state) => ({
      tenantId,
      stateCode: state.code,
      stateName: state.name,
      deliveryMinor: STANDARD_DELIVERY_MINOR,
      enabled: true,
    })),
    skipDuplicates: true,
  });
}

/** Authoritative delivery fee for checkout (server-only). */
export async function resolveDeliveryMinorForState(
  tenantId: string,
  stateInput: string,
): Promise<{ stateCode: NigeriaStateCode; deliveryMinor: number }> {
  const stateCode = normalizeNigeriaStateCode(stateInput);
  if (!stateCode) {
    throw new ValidationError("Select a valid Nigerian state for delivery.");
  }

  let rate = await prisma.deliveryStateRate.findUnique({
    where: { tenantId_stateCode: { tenantId, stateCode } },
  });

  if (!rate) {
    await ensureDefaultDeliveryRatesForTenant(tenantId);
    rate = await prisma.deliveryStateRate.findUnique({
      where: { tenantId_stateCode: { tenantId, stateCode } },
    });
  }

  if (!rate || !rate.enabled) {
    throw new ValidationError("Delivery is not available for the selected state.");
  }

  if (rate.deliveryMinor < 0) {
    throw new ValidationError("Invalid delivery fee configuration.");
  }

  return { stateCode, deliveryMinor: rate.deliveryMinor };
}

export async function listDeliveryRatesForAdmin(
  context: RequestContext,
): Promise<DeliveryRateRow[]> {
  authorize(context, "settings.manage");
  const tenantId = context.tenantId!;
  await ensureDefaultDeliveryRatesForTenant(tenantId);

  const rows = await prisma.deliveryStateRate.findMany({
    where: { tenantId },
    orderBy: { stateName: "asc" },
  });

  return rows.map((r) => ({
    stateCode: r.stateCode as NigeriaStateCode,
    stateName: r.stateName,
    deliveryMinor: r.deliveryMinor,
    enabled: r.enabled,
  }));
}

export async function updateDeliveryRatesForAdmin(
  context: RequestContext,
  updates: { stateCode: string; deliveryMinor: number; enabled?: boolean }[],
) {
  authorize(context, "settings.manage");
  const tenantId = context.tenantId!;

  for (const row of updates) {
    const code = normalizeNigeriaStateCode(row.stateCode);
    if (!code) continue;
    if (!Number.isInteger(row.deliveryMinor) || row.deliveryMinor < 0) {
      throw new ValidationError(`Invalid delivery amount for ${code}.`);
    }

    await prisma.deliveryStateRate.upsert({
      where: { tenantId_stateCode: { tenantId, stateCode: code } },
      update: {
        deliveryMinor: row.deliveryMinor,
        ...(row.enabled !== undefined ? { enabled: row.enabled } : {}),
        stateName: nigeriaStateName(code),
      },
      create: {
        tenantId,
        stateCode: code,
        stateName: nigeriaStateName(code),
        deliveryMinor: row.deliveryMinor,
        enabled: row.enabled ?? true,
      },
    });
  }
}
