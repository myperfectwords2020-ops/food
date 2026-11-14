# Security (Phase 0 foundation)

## Trust model

The browser is untrusted. The server must authorize every protected operation and compute financial values.

Never trust client-provided: prices, totals, discounts, inventory, payment status, roles, `tenantId`, or resource ownership IDs.

## Authentication

- **NextAuth (Auth.js v5)** with Credentials provider and **JWT sessions** (`src/lib/auth/`).
- Route: `src/app/api/auth/[...nextauth]/route.ts`.
- Passwords stored as bcrypt hashes on `User.passwordHash`.
- `AUTH_SECRET` required in production (min 32 characters).

**Phase 1:** `/admin/*` requires staff+ roles (middleware + server layout). `/account/*` (except login/register) requires a **CUSTOMER** session. Checkout requires customer auth.

## Authorization

- Roles: `CUSTOMER`, `STAFF`, `ADMIN`, `SUPER_ADMIN` (Prisma enum).
- Central permissions: `src/lib/auth/permissions.ts`.
- Helpers: `src/lib/auth/authorize.ts`, `src/lib/auth/tenant-context.ts`.

## Tenant isolation

- `assertSameTenant(sessionTenantId, resourceTenantId, isSuperAdmin?)`
- Query scoping via `tenantWhere(sessionTenantId, isSuperAdmin)`

## Errors and logging

- User-facing errors use `AppError` subclasses; raw DB/stack traces are not exposed in production JSON.
- Logger redacts sensitive keys (`src/lib/logger/logger.ts`).

## Audit

- `writeAuditLog()` persists to `AuditLog` for sensitive operations (call sites added in later phases).

## Rate limiting

- Redis-backed stub in `src/lib/security/rate-limit.ts` (foundation only).

## Secrets

- Use `.env` locally; `.env.example` documents variables.
- Only `NEXT_PUBLIC_*` values may reach the client.

## Idempotency

- `IdempotencyKey` model reserved for checkout/payment/webhooks in later phases.
