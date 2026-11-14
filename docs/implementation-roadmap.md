# Implementation roadmap

## Phase 0 — Foundation ✅

- [x] Prisma schema and migrations
- [x] Env validation, logging, errors
- [x] Auth.js + JWT + permissions skeleton
- [x] Tenant isolation helpers
- [x] Redis + BullMQ stubs
- [x] Provider interfaces
- [x] Foundation tests
- [x] Architecture docs

## Phase 1 — Authentication, authorization & multi-tenant security ✅

- [x] Production credentials auth (tenant-scoped email)
- [x] User status, tenant status, password reset token model
- [x] Central permissions + `RequestContext`
- [x] Customer ownership in account/order services
- [x] Tenant-scoped repositories/services
- [x] Middleware + admin layout protection
- [x] Account UI wired to real auth (login/register/account/checkout)
- [x] Rate limiting on login/signup actions (Redis when configured)
- [x] Audit logs for auth events
- [x] Security headers (Next.js config)
- [x] Seed users + sample order
- [x] Tests (unit + optional DB integration via `RUN_DB_INTEGRATION=1`)
- [x] Docs: `authentication.md`, `authorization.md`, `multi-tenancy.md`

## Phase 2 — Catalog, inventory & recommendations ✅

- [x] Product schema (categories, extended product fields, customer recommendations)
- [x] Public catalog search/filter/sort/pagination (PostgreSQL)
- [x] Admin product CRUD + inventory adjustments (audited)
- [x] Deterministic recommendation engine + `/routine` wiring
- [x] Storefront `/shop`, `/products/[slug]`, `/search`, `/categories`, admin products/inventory
- [ ] S3 image upload (URLs in DB; `StorageService` implementation in a later phase)
- [ ] Fine-grained admin route permissions per section

## Phase 3 — Cart & checkout

- Persistent cart, server-side totals, `IdempotencyKey`
- Order creation transaction

## Phase 4 — Payments

- Paystack initialize/verify/webhooks
- `PaymentService` implementation

## Phase 5 — CRM & leads

- Lead CRUD, conversion, customer preferences sync

## Phase 6 — AI assistant

- `AIService` provider, conversation persistence, safe tools

## Phase 7 — Notifications & automations

- Email/WhatsApp providers, automation worker execution

## Phase 11 — Analytics & reporting ✅

- [x] Tenant-scoped analytics services (`src/modules/analytics/`)
- [x] Live `/admin/analytics` and admin dashboard KPIs (`analytics.read`)
- [x] Revenue, orders, products, customers, leads, AI, conversations, automations, notifications
- [x] Metric definitions in `docs/analytics.md`
- [x] Unit tests (`src/test/phase11/`)

## Phase 12 — Production hardening (not started)

- E2E critical paths, extended observability, export/reporting enhancements

UI redesign is **out of scope** unless required for wiring, accessibility, or security.
