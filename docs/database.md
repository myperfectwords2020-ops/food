# Database (Phase 0)

## Stack

- **PostgreSQL** — source of truth
- **Prisma** — schema and migrations in `prisma/`

## Money

All monetary amounts use **integer minor units** (e.g. kobo for NGN): `priceMinor`, `subtotalMinor`, etc. Helpers live in `src/lib/money.ts`.

## Order snapshots

`OrderItem` stores `productName` and `unitPriceMinor` at purchase time so catalog changes do not alter historical orders.

## Core models (implemented in schema)

- **Tenancy:** `Tenant`, `TenantSettings`
- **Auth:** `User`, `Account`, `Session`, `VerificationToken` (Auth.js)
- **Commerce:** `Product`, images, ingredients, skin types/concerns, join tables, `Cart`, `CartItem`, `Order`, `OrderItem`, `Payment`, `InventoryTransaction`
- **CRM:** `Customer`, `Address`, `CustomerPreference`, `Lead`
- **Messaging:** `Conversation`, `Message`
- **Automation:** `Automation`, `AutomationRun`
- **Platform:** `AuditLog`, `WebhookEvent`, `IdempotencyKey`

## Indexes

Schema includes indexes on common filters: `tenantId`, slugs, status fields, `createdAt`, and foreign keys.

## Commands

```bash
cp .env.example .env   # set DATABASE_URL
npm run db:validate
npm run db:migrate     # development
npm run db:migrate:deploy  # production
npm run db:generate
```

## Migrations

Initial migration: `prisma/migrations/` (created via `prisma migrate dev` or deploy SQL). Apply before running auth or any server persistence.
