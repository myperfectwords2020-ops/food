import type { Lead, LeadActivityType, LeadSource, Prisma } from "@prisma/client";

import { writeAuditLog } from "@/lib/audit/audit-log.service";
import type { RequestContext } from "@/lib/auth/types";
import { authorize } from "@/lib/auth/authorize-context";
import { prisma } from "@/lib/db/prisma";
import { tenantScopeWhere } from "@/lib/db/tenant-query";
import { checkoutTransactionOptions } from "@/lib/db/transaction-options";
import {
  dispatchDomainEvents,
  enqueueDomainEventInTransaction,
} from "@/lib/events/domain-event-outbox";
import { DomainEventTypes, emitDomainEvent, type DomainEvent } from "@/lib/events/domain-events";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors/app-error";
import {
  bumpCustomerLifecycleOnLeadCreated,
  bumpCustomerLifecycleOnLeadQualified,
} from "@/modules/leads/customer-lifecycle.service";
import { toLeadDetailDTO, toLeadListItemDTO } from "@/modules/leads/lead.dto";
import {
  formatLeadName,
  normalizeEmail,
  normalizePhone,
  splitDisplayName,
} from "@/modules/leads/lead-phone";
import { scoreLead } from "@/modules/leads/lead-scoring.service";
import { assertLeadStatusTransition, isTerminalLeadStatus } from "@/modules/leads/lead-status";

export type CreateLeadInput = {
  tenantId: string;
  source: LeadSource;
  sourceDetail?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  concern?: string | null;
  interest?: string | null;
  notes?: string | null;
  marketingOptIn?: boolean;
  marketingConsentSource?: string | null;
  attribution?: {
    utmSource?: string | undefined;
    utmMedium?: string | undefined;
    utmCampaign?: string | undefined;
    utmTerm?: string | undefined;
    utmContent?: string | undefined;
    referrer?: string | undefined;
    landingPage?: string | undefined;
  };
  actorUserId?: string | null;
  routineCompleted?: boolean;
  customerId?: string | null;
};

const ACTIVE_LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED"] as const;

async function recordActivity(
  tx: Prisma.TransactionClient,
  input: {
    tenantId: string;
    leadId: string;
    type: LeadActivityType;
    description: string;
    actorUserId?: string | null | undefined;
    metadata?: Record<string, unknown> | undefined;
  },
) {
  await tx.leadActivity.create({
    data: {
      tenantId: input.tenantId,
      leadId: input.leadId,
      type: input.type,
      description: input.description,
      actorUserId: input.actorUserId ?? null,
      ...(input.metadata !== undefined
        ? { metadata: input.metadata as Prisma.InputJsonValue }
        : {}),
    },
  });
}

async function findDedupeTarget(tenantId: string, email: string | null, phone: string | null) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  const existingLead = await prisma.lead.findFirst({
    where: {
      tenantId,
      status: { in: [...ACTIVE_LEAD_STATUSES] },
      OR: [
        ...(normalizedEmail ? [{ normalizedEmail }] : []),
        ...(normalizedPhone ? [{ normalizedPhone }] : []),
      ],
    },
    orderBy: { updatedAt: "desc" },
  });

  let customerId: string | null = null;
  if (normalizedEmail) {
    const customer = await prisma.customer.findFirst({
      where: { tenantId, email: normalizedEmail },
      select: { id: true },
    });
    customerId = customer?.id ?? null;
  }
  if (!customerId && normalizedPhone) {
    const customer = await prisma.customer.findFirst({
      where: { tenantId, phone: { contains: normalizedPhone.slice(-10) } },
      select: { id: true },
    });
    customerId = customer?.id ?? null;
  }

  return { existingLead, customerId, normalizedEmail, normalizedPhone };
}

export async function createLead(input: CreateLeadInput) {
  if (!input.email && !input.phone) {
    throw new ValidationError("Email or phone is required.");
  }

  const { existingLead, customerId, normalizedEmail, normalizedPhone } = await findDedupeTarget(
    input.tenantId,
    input.email ?? null,
    input.phone ?? null,
  );

  const { firstName, lastName } = splitDisplayName(input.name);
  const displayName = formatLeadName(firstName, lastName, input.name.trim());
  const scoring = scoreLead({
    email: normalizedEmail,
    phone: normalizedPhone,
    source: input.source,
    concern: input.concern,
    interest: input.interest,
    routineCompleted: input.routineCompleted,
    hasExistingCustomer: Boolean(customerId ?? input.customerId),
    marketingOptIn: input.marketingOptIn,
  });

  const events: DomainEvent[] = [];

  const lead = await prisma.$transaction(async (tx) => {
    let row: Lead;

    if (existingLead) {
      const notes = Array.isArray(existingLead.notes) ? [...(existingLead.notes as string[])] : [];
      if (input.notes?.trim()) notes.push(input.notes.trim());

      row = await tx.lead.update({
        where: { id: existingLead.id },
        data: {
          name: displayName,
          firstName,
          lastName,
          email: normalizedEmail ?? existingLead.email,
          phone: input.phone?.trim() || existingLead.phone,
          normalizedEmail: normalizedEmail ?? existingLead.normalizedEmail,
          normalizedPhone: normalizedPhone ?? existingLead.normalizedPhone,
          concern: input.concern ?? existingLead.concern,
          interest: input.interest ?? existingLead.interest,
          customerId: existingLead.customerId ?? customerId ?? input.customerId ?? null,
          score: scoring.score,
          scoreReasons: scoring.reasons,
          notes: notes as Prisma.InputJsonValue,
          ...(input.marketingOptIn
            ? {
                marketingOptIn: true,
                marketingConsentAt: new Date(),
                marketingConsentSource: input.marketingConsentSource ?? input.source,
              }
            : {}),
        },
      });

      await recordActivity(tx, {
        tenantId: input.tenantId,
        leadId: row.id,
        type: "SYSTEM_EVENT",
        description: "Lead record updated from repeat capture",
        actorUserId: input.actorUserId,
        metadata: { source: input.source },
      });
    } else {
      const attribution = input.attribution;
      row = await tx.lead.create({
        data: {
          tenantId: input.tenantId,
          name: displayName,
          firstName,
          lastName,
          email: normalizedEmail,
          phone: input.phone?.trim() || null,
          normalizedEmail,
          normalizedPhone,
          source: input.source,
          sourceDetail: input.sourceDetail ?? null,
          status: scoring.suggestedStatus === "QUALIFIED" ? "QUALIFIED" : "NEW",
          qualifiedAt: scoring.suggestedStatus === "QUALIFIED" ? new Date() : null,
          score: scoring.score,
          scoreReasons: scoring.reasons,
          concern: input.concern ?? null,
          interest: input.interest ?? null,
          ...(input.notes ? { notes: [input.notes] as Prisma.InputJsonValue } : {}),
          customerId: customerId ?? input.customerId ?? null,
          marketingOptIn: input.marketingOptIn ?? false,
          marketingConsentAt: input.marketingOptIn ? new Date() : null,
          marketingConsentSource: input.marketingOptIn
            ? (input.marketingConsentSource ?? input.source)
            : null,
          ...(attribution?.utmSource ? { utmSource: attribution.utmSource } : {}),
          ...(attribution?.utmMedium ? { utmMedium: attribution.utmMedium } : {}),
          ...(attribution?.utmCampaign ? { utmCampaign: attribution.utmCampaign } : {}),
          ...(attribution?.utmTerm ? { utmTerm: attribution.utmTerm } : {}),
          ...(attribution?.utmContent ? { utmContent: attribution.utmContent } : {}),
          ...(attribution?.referrer ? { referrer: attribution.referrer } : {}),
          ...(attribution?.landingPage ? { landingPage: attribution.landingPage } : {}),
        },
      });

      await recordActivity(tx, {
        tenantId: input.tenantId,
        leadId: row.id,
        type: "CREATED",
        description: `Lead created from ${input.source}`,
        actorUserId: input.actorUserId,
      });

      const createdEvent: DomainEvent = {
        type: DomainEventTypes.LEAD_CREATED,
        tenantId: input.tenantId,
        occurredAt: new Date().toISOString(),
        payload: { leadId: row.id, source: input.source, score: scoring.score },
      };
      await enqueueDomainEventInTransaction(tx, createdEvent);
      events.push(createdEvent);
    }

    return row;
  }, checkoutTransactionOptions);

  await writeAuditLog({
    tenantId: input.tenantId,
    actorId: input.actorUserId ?? undefined,
    action: existingLead ? "LEAD_UPDATED" : "LEAD_CREATED",
    entityType: "Lead",
    entityId: lead.id,
    metadata: { source: input.source },
  });

  await dispatchDomainEvents(events);

  const linkedCustomerId = lead.customerId;
  if (linkedCustomerId) {
    await bumpCustomerLifecycleOnLeadCreated({
      tenantId: input.tenantId,
      customerId: linkedCustomerId,
    });
    if (lead.status === "QUALIFIED") {
      await bumpCustomerLifecycleOnLeadQualified({
        tenantId: input.tenantId,
        customerId: linkedCustomerId,
      });
    }
  }

  return lead;
}

export async function getLeadForTenant(tenantId: string, leadId: string) {
  return prisma.lead.findFirst({
    where: { id: leadId, tenantId },
    include: {
      owner: { select: { firstName: true, lastName: true, email: true } },
      activities: {
        orderBy: { createdAt: "asc" },
        include: { actor: { select: { firstName: true, lastName: true, email: true } } },
      },
    },
  });
}

export async function convertLead(context: RequestContext, leadId: string) {
  authorize(context, "crm.leads.convert");
  const tenantId = context.tenantId;
  if (!tenantId) throw new ValidationError("Tenant required.");

  const events: DomainEvent[] = [];

  const result = await prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findFirst({
      where: { id: leadId, ...tenantScopeWhere(tenantId, context.role) },
    });
    if (!lead) throw new NotFoundError("Lead not found.");

    if (lead.status === "CONVERTED" && lead.customerId) {
      return { lead, customerId: lead.customerId, alreadyConverted: true };
    }
    if (isTerminalLeadStatus(lead.status) && lead.status === "CONVERTED") {
      return { lead, customerId: lead.customerId!, alreadyConverted: true };
    }

    if (lead.status !== "CONVERTED") {
      if (lead.status !== "QUALIFIED" && lead.status !== "NEW" && lead.status !== "CONTACTED") {
        assertLeadStatusTransition(lead.status, "CONVERTED");
      }
    }

    let customerId = lead.customerId;
    const email = lead.normalizedEmail ?? normalizeEmail(lead.email);
    if (!customerId && email) {
      const existing = await tx.customer.findFirst({
        where: { tenantId, email },
        select: { id: true },
      });
      customerId = existing?.id ?? null;
    }

    if (!customerId) {
      if (!email) {
        throw new ValidationError("Lead must have an email to convert to a customer.");
      }
      const created = await tx.customer.create({
        data: {
          tenantId,
          email,
          phone: lead.phone,
          firstName: lead.firstName,
          lastName: lead.lastName,
          lifecycle: "LEAD",
        },
      });
      await tx.customerPreference.create({
        data: {
          tenantId,
          customerId: created.id,
          emailOffers: lead.marketingOptIn,
          emailOffersConsentAt: lead.marketingOptIn ? lead.marketingConsentAt : null,
          marketingConsentVersion: lead.marketingOptIn ? "phase6" : null,
        },
      });
      customerId = created.id;
    }

    const updated = await tx.lead.update({
      where: { id: lead.id },
      data: {
        status: "CONVERTED",
        customerId,
        convertedAt: new Date(),
      },
    });

    await recordActivity(tx, {
      tenantId,
      leadId: lead.id,
      type: "CONVERTED",
      description: "Lead converted to customer",
      actorUserId: context.userId,
      metadata: { customerId },
    });

    const convertedEvent: DomainEvent = {
      type: DomainEventTypes.LEAD_CONVERTED,
      tenantId,
      occurredAt: new Date().toISOString(),
      payload: { leadId: lead.id, customerId },
    };
    await enqueueDomainEventInTransaction(tx, convertedEvent);
    events.push(convertedEvent);

    return { lead: updated, customerId, alreadyConverted: false };
  }, checkoutTransactionOptions);

  await writeAuditLog({
    tenantId,
    actorId: context.userId,
    action: "LEAD_CONVERTED",
    entityType: "Lead",
    entityId: leadId,
    metadata: { customerId: result.customerId, alreadyConverted: result.alreadyConverted },
  });

  await dispatchDomainEvents(events);

  return result;
}

export async function assignLead(context: RequestContext, leadId: string, ownerId: string | null) {
  authorize(context, "crm.leads.assign");
  const tenantId = context.tenantId!;
  if (ownerId) {
    const user = await prisma.user.findFirst({
      where: {
        id: ownerId,
        tenantId,
        status: "ACTIVE",
        role: { in: ["STAFF", "ADMIN", "SUPER_ADMIN"] },
      },
      select: { id: true },
    });
    if (!user) throw new ValidationError("Assignee must be an active staff member in this tenant.");
  }

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, tenantId },
  });
  if (!lead) throw new NotFoundError("Lead not found.");

  await prisma.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id: leadId },
      data: { ownerId },
    });
    await recordActivity(tx, {
      tenantId,
      leadId,
      type: "ASSIGNED",
      description: ownerId ? "Lead assigned to staff member" : "Lead unassigned",
      actorUserId: context.userId,
      metadata: { ownerId },
    });
  });

  await writeAuditLog({
    tenantId,
    actorId: context.userId,
    action: "LEAD_ASSIGNED",
    entityType: "Lead",
    entityId: leadId,
    metadata: { ownerId },
  });

  await emitDomainEvent({
    type: DomainEventTypes.LEAD_ASSIGNED,
    tenantId,
    occurredAt: new Date().toISOString(),
    payload: { leadId, ownerId },
  });
}

export async function changeLeadStatus(
  context: RequestContext,
  leadId: string,
  status: Lead["status"],
) {
  authorize(context, "crm.leads.update");
  const tenantId = context.tenantId!;
  const lead = await prisma.lead.findFirst({ where: { id: leadId, tenantId } });
  if (!lead) throw new NotFoundError("Lead not found.");
  if (lead.status === "CONVERTED") {
    throw new ConflictError("Converted leads cannot change status.");
  }

  assertLeadStatusTransition(lead.status, status);

  await prisma.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id: leadId },
      data: {
        status,
        qualifiedAt: status === "QUALIFIED" ? new Date() : lead.qualifiedAt,
        lostAt: status === "LOST" ? new Date() : lead.lostAt,
      },
    });
    await recordActivity(tx, {
      tenantId,
      leadId,
      type: "STATUS_CHANGED",
      description: `Status changed to ${status}`,
      actorUserId: context.userId,
      metadata: { from: lead.status, to: status },
    });
  });

  await writeAuditLog({
    tenantId,
    actorId: context.userId,
    action: "LEAD_STATUS_CHANGED",
    entityType: "Lead",
    entityId: leadId,
    metadata: { from: lead.status, to: status },
  });

  await emitDomainEvent({
    type: DomainEventTypes.LEAD_STATUS_CHANGED,
    tenantId,
    occurredAt: new Date().toISOString(),
    payload: { leadId, from: lead.status, to: status },
  });
}

export async function addLeadNote(context: RequestContext, leadId: string, note: string) {
  authorize(context, "crm.leads.notes");
  const tenantId = context.tenantId!;
  const lead = await prisma.lead.findFirst({ where: { id: leadId, tenantId } });
  if (!lead) throw new NotFoundError("Lead not found.");

  const notes = Array.isArray(lead.notes) ? [...(lead.notes as string[])] : [];
  notes.push(note.trim());

  await prisma.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id: leadId },
      data: { notes: notes as Prisma.InputJsonValue },
    });
    await recordActivity(tx, {
      tenantId,
      leadId,
      type: "NOTE_ADDED",
      description: "Internal note added",
      actorUserId: context.userId,
    });
  });

  await writeAuditLog({
    tenantId,
    actorId: context.userId,
    action: "LEAD_NOTE_ADDED",
    entityType: "Lead",
    entityId: leadId,
  });
}

export async function qualifyLead(context: RequestContext, leadId: string) {
  authorize(context, "crm.leads.qualify");
  await changeLeadStatus(context, leadId, "QUALIFIED");
  const tenantId = context.tenantId!;
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, tenantId },
    select: { customerId: true },
  });
  if (lead?.customerId) {
    await bumpCustomerLifecycleOnLeadQualified({ tenantId, customerId: lead.customerId });
  }
  await emitDomainEvent({
    type: DomainEventTypes.LEAD_QUALIFIED,
    tenantId,
    occurredAt: new Date().toISOString(),
    payload: { leadId },
  });
}

export function mapLeadDetail(lead: NonNullable<Awaited<ReturnType<typeof getLeadForTenant>>>) {
  return toLeadDetailDTO(lead, lead.activities);
}

export function mapLeadListItem(
  lead: Lead & {
    owner: { firstName: string | null; lastName: string | null; email: string } | null;
  },
  lastActivity: Date,
) {
  return toLeadListItemDTO(lead, lastActivity);
}

/** Future AI boundary — no LLM in Phase 6. */
export async function createLeadFromAssistant(input: Omit<CreateLeadInput, "source">) {
  return createLead({ ...input, source: "AI_ASSISTANT" });
}
