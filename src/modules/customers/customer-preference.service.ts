import { writeAuditLog } from "@/lib/audit/audit-log.service";
import { authorize } from "@/lib/auth/authorize-context";
import type { RequestContext } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import { getCustomerForUser } from "@/modules/customers/customer-access.service";
import {
  skinProfileSchema,
  updatePreferencesSchema,
  type SkinProfile,
  type UpdatePreferencesInput,
} from "@/modules/customers/customer.validation";

const MARKETING_CONSENT_VERSION = "2026-03-01";

function mapPreferences(row: {
  emailOffers: boolean;
  smsUpdates: boolean;
  whatsappOffers: boolean;
  fragranceFree: boolean;
  routineReminders: boolean;
  communicationChannel: string | null;
}) {
  return {
    emailOffers: row.emailOffers,
    smsUpdates: row.smsUpdates,
    whatsappOffers: row.whatsappOffers,
    fragranceFree: row.fragranceFree,
    routineReminders: row.routineReminders,
    communicationChannel:
      (row.communicationChannel as "email" | "sms" | "whatsapp" | null) ?? "email",
  };
}

export async function updateCustomerPreferences(
  context: RequestContext & { customerId: string },
  raw: UpdatePreferencesInput,
) {
  authorize(context, "preferences.update_own");
  const parsed = updatePreferencesSchema.parse(raw);
  const customer = await getCustomerForUser(context);
  const tenantId = context.tenantId!;
  const now = new Date();

  const existing = customer.preferences;
  const emailConsentAt =
    parsed.emailOffers && !existing?.emailOffers ? now : existing?.emailOffersConsentAt;
  const whatsappConsentAt =
    parsed.whatsappOffers && !existing?.whatsappOffers ? now : existing?.whatsappOffersConsentAt;

  const updated = await prisma.customerPreference.upsert({
    where: { customerId: customer.id },
    create: {
      tenantId,
      customerId: customer.id,
      emailOffers: parsed.emailOffers,
      smsUpdates: parsed.smsUpdates,
      whatsappOffers: parsed.whatsappOffers,
      fragranceFree: parsed.fragranceFree,
      routineReminders: parsed.routineReminders,
      communicationChannel: parsed.communicationChannel ?? "email",
      emailOffersConsentAt: parsed.emailOffers ? now : null,
      whatsappOffersConsentAt: parsed.whatsappOffers ? now : null,
      marketingConsentVersion: MARKETING_CONSENT_VERSION,
    },
    update: {
      emailOffers: parsed.emailOffers,
      smsUpdates: parsed.smsUpdates,
      whatsappOffers: parsed.whatsappOffers,
      fragranceFree: parsed.fragranceFree,
      routineReminders: parsed.routineReminders,
      communicationChannel:
        parsed.communicationChannel ?? existing?.communicationChannel ?? "email",
      emailOffersConsentAt: emailConsentAt ?? null,
      whatsappOffersConsentAt: whatsappConsentAt ?? null,
      marketingConsentVersion: MARKETING_CONSENT_VERSION,
    },
  });

  await writeAuditLog({
    tenantId,
    actorId: context.userId,
    action: "customer.preferences_updated",
    entityType: "CustomerPreference",
    entityId: updated.id,
    metadata: {
      emailOffers: parsed.emailOffers,
      whatsappOffers: parsed.whatsappOffers,
    },
  });

  if (
    parsed.emailOffers !== existing?.emailOffers ||
    parsed.whatsappOffers !== existing?.whatsappOffers
  ) {
    await writeAuditLog({
      tenantId,
      actorId: context.userId,
      action: "customer.marketing_consent_changed",
      entityType: "Customer",
      entityId: customer.id,
    });
  }

  return mapPreferences(updated);
}

export async function upsertSkinProfile(
  tenantId: string,
  customerId: string,
  profile: SkinProfile,
) {
  const parsed = skinProfileSchema.parse(profile);
  await prisma.customerPreference.upsert({
    where: { customerId },
    create: { tenantId, customerId, skinProfile: parsed },
    update: { skinProfile: parsed },
  });
}

export async function getSkinProfileForCustomer(context: RequestContext & { customerId: string }) {
  authorize(context, "preferences.read_own");
  const customer = await getCustomerForUser(context);
  const raw = customer.preferences?.skinProfile;
  if (!raw) return null;
  return skinProfileSchema.safeParse(raw).success ? skinProfileSchema.parse(raw) : null;
}
