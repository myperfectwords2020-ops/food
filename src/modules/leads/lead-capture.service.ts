import type { LeadSource } from "@prisma/client";

import { getDefaultTenantSlug } from "@/config/tenant-defaults";
import { rateLimit } from "@/lib/security/rate-limit";
import { createLead } from "@/modules/leads/lead.service";
import { publicLeadCaptureSchema } from "@/modules/leads/lead.validation";
import { findTenantBySlug } from "@/modules/tenants/tenant.repository";

export async function capturePublicLead(input: {
  source: LeadSource;
  body: unknown;
  ipKey?: string;
}) {
  const parsed = publicLeadCaptureSchema.parse(input.body);
  if (parsed.website) {
    return { ok: false as const, error: "Invalid submission." };
  }

  const tenant = await findTenantBySlug(getDefaultTenantSlug());
  if (!tenant) {
    return { ok: false as const, error: "Service unavailable." };
  }
  const tenantId = tenant.id;

  const rlKey = `lead:${tenantId}:${input.ipKey ?? "anon"}`;
  const allowed = await rateLimit(rlKey, 8, 3600);
  if (!allowed) {
    return { ok: false as const, error: "Too many requests. Please try again later." };
  }

  if (!parsed.email && !parsed.phone) {
    return { ok: false as const, error: "Email or phone is required." };
  }

  const lead = await createLead({
    tenantId,
    source: input.source,
    sourceDetail: parsed.sourceDetail ?? null,
    name: parsed.name,
    email: parsed.email && parsed.email.length > 0 ? parsed.email : null,
    phone: parsed.phone ?? null,
    concern: parsed.concern ?? null,
    interest: parsed.interest ?? null,
    notes: parsed.message ?? null,
    marketingOptIn: parsed.marketingOptIn ?? false,
    marketingConsentSource: input.source,
    ...(parsed.attribution ? { attribution: parsed.attribution } : {}),
  });

  return { ok: true as const, leadId: lead.id };
}
