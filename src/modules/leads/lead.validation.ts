import { z } from "zod";

import { LeadSource } from "@prisma/client";

const utmField = z.string().trim().max(200).optional();

export const leadAttributionSchema = z.object({
  utmSource: utmField,
  utmMedium: utmField,
  utmCampaign: utmField,
  utmTerm: utmField,
  utmContent: utmField,
  referrer: z.string().trim().max(500).optional(),
  landingPage: z.string().trim().max(500).optional(),
});

export const publicLeadCaptureSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.union([z.string().trim().email().max(320), z.literal("")]).optional(),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().max(5000).optional(),
  concern: z.string().trim().max(200).optional(),
  interest: z.string().trim().max(200).optional(),
  sourceDetail: z.string().trim().max(200).optional(),
  marketingOptIn: z.boolean().optional(),
  website: z.string().max(0).optional(),
  attribution: leadAttributionSchema.optional(),
});

export const adminLeadListFiltersSchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED", "LOST"]).optional(),
  source: z.nativeEnum(LeadSource).optional(),
  ownerId: z.string().cuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const assignLeadSchema = z.object({
  leadId: z.string().cuid(),
  ownerId: z.string().cuid().nullable(),
});

export const changeLeadStatusSchema = z.object({
  leadId: z.string().cuid(),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED", "LOST"]),
});

export const addLeadNoteSchema = z.object({
  leadId: z.string().cuid(),
  note: z.string().trim().min(1).max(4000),
});

export const convertLeadSchema = z.object({
  leadId: z.string().cuid(),
});

export type PublicLeadCaptureInput = z.infer<typeof publicLeadCaptureSchema>;
