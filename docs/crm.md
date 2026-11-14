# CRM — Leads & customer lifecycle (Phase 6)

## Overview

Production CRM lives under `src/modules/leads/`. PostgreSQL is the source of truth. TanStack Query powers admin list/detail mutations.

## Lead status

Controlled enum: `NEW`, `CONTACTED`, `QUALIFIED`, `UNQUALIFIED`, `CONVERTED`, `LOST`.

Transitions are validated in `lead-status.ts`. Clients cannot set status directly; use server actions.

## Lead sources

`WEBSITE`, `ROUTINE`, `AI_ASSISTANT`, `CAMPAIGN`, `SOCIAL`, `REFERRAL`, `MANUAL`, `CONTACT_FORM`, `NEWSLETTER`.

`sourceDetail` holds channel-specific context (e.g. campaign name).

## Qualification & scoring

Deterministic scoring in `lead-scoring.service.ts` (no LLM). Returns score (0–100), reasons, and suggested status.

Staff qualification uses `qualifyLead()` → status `QUALIFIED` + `LEAD_QUALIFIED` event.

## Deduplication

Within a tenant, normalized email and phone match active leads (`NEW`–`UNQUALIFIED`). Repeat capture updates the existing lead and appends activity instead of creating duplicates.

Customer lookup by email links `customerId` when a profile already exists.

## Conversion

`convertLead()` is idempotent. Reuses existing customer by email; otherwise creates customer + preference row. Marketing opt-in on the lead maps to `emailOffers` consent fields only when explicitly opted in.

## Customer lifecycle

`LeadLifecycleStage` on `Customer`: `VISITOR`, `LEAD`, `QUALIFIED`, `CUSTOMER`, `REPEAT_CUSTOMER`.

`CustomerLifecycleService` reacts to `ORDER_PAID` (registered in `register-domain-handlers.ts`):

- First qualifying paid order → `CUSTOMER`
- Second+ → `REPEAT_CUSTOMER`

Lead events may bump linked customers from `VISITOR` → `LEAD` or → `QUALIFIED`.

## Consent

Lead status ≠ marketing consent. `marketingOptIn` / `marketingConsentAt` on leads; customer preferences hold durable consent.

## Permissions

`crm.leads.read`, `crm.leads.create`, `crm.leads.update`, `crm.leads.assign`, `crm.leads.qualify`, `crm.leads.convert`, `crm.leads.notes`, `crm.leads.delete`.

## Domain & audit events

Outbox + in-process dispatch: `LEAD_CREATED`, `LEAD_QUALIFIED`, `LEAD_ASSIGNED`, `LEAD_CONVERTED`, `LEAD_STATUS_CHANGED`, `CUSTOMER_LIFECYCLE_CHANGED`.

Audit actions mirror CRM mutations via `writeAuditLog`.

## Public capture

Contact form → `capturePublicLead` with rate limiting and honeypot. Tenant resolved server-side from default slug.

## Future phases

`createLeadFromAssistant()` is the AI boundary only — no LLM or automation in Phase 6.
