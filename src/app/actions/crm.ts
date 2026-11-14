"use server";

import { headers } from "next/headers";

import { runSecureAction } from "@/lib/api/secure-action";
import { capturePublicLead } from "@/modules/leads/lead-capture.service";
import {
  addLeadNote,
  assignLead,
  changeLeadStatus,
  convertLead,
  qualifyLead,
} from "@/modules/leads/lead.service";
import {
  addLeadNoteSchema,
  assignLeadSchema,
  changeLeadStatusSchema,
  convertLeadSchema,
  publicLeadCaptureSchema,
} from "@/modules/leads/lead.validation";
import type { LeadSource } from "@prisma/client";

async function clientIpKey() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
}

export async function submitContactLeadAction(body: unknown) {
  const parsed = publicLeadCaptureSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, error: "Please check your details and try again." };
  }
  return capturePublicLead({
    source: "CONTACT_FORM",
    body: parsed.data,
    ipKey: await clientIpKey(),
  });
}

export async function convertLeadAction(leadId: string) {
  return runSecureAction("crm.leads.convert", async (ctx) => {
    const parsed = convertLeadSchema.parse({ leadId });
    const result = await convertLead(ctx, parsed.leadId);
    return { customerId: result.customerId, alreadyConverted: result.alreadyConverted };
  });
}

export async function assignLeadAction(input: unknown) {
  return runSecureAction("crm.leads.assign", async (ctx) => {
    const parsed = assignLeadSchema.parse(input);
    await assignLead(ctx, parsed.leadId, parsed.ownerId);
    return { ok: true };
  });
}

export async function changeLeadStatusAction(input: unknown) {
  return runSecureAction("crm.leads.update", async (ctx) => {
    const parsed = changeLeadStatusSchema.parse(input);
    await changeLeadStatus(ctx, parsed.leadId, parsed.status);
    return { ok: true };
  });
}

export async function qualifyLeadAction(leadId: string) {
  return runSecureAction("crm.leads.qualify", async (ctx) => {
    await qualifyLead(ctx, leadId);
    return { ok: true };
  });
}

export async function addLeadNoteAction(input: unknown) {
  return runSecureAction("crm.leads.notes", async (ctx) => {
    const parsed = addLeadNoteSchema.parse(input);
    await addLeadNote(ctx, parsed.leadId, parsed.note);
    return { ok: true };
  });
}

export async function captureRoutineLeadAction(input: {
  name: string;
  email?: string;
  phone?: string;
  concern?: string;
  interest?: string;
}) {
  const tenantLead = await capturePublicLead({
    source: "ROUTINE" as LeadSource,
    body: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      concern: input.concern,
      interest: input.interest,
    },
    ipKey: await clientIpKey(),
  });
  return tenantLead;
}
