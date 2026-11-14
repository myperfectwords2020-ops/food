# Architecture (Phase 0 — foundation)

## Status

Phase 0 delivered configuration, PostgreSQL, Prisma, Redis/BullMQ stubs, and core libraries. **Phase 1** added production authentication, authorization, tenant isolation, and customer account data from PostgreSQL. Storefront catalog, admin CRUD, Paystack, AI backend, and automation execution remain on mocks or stubs until later phases.

## Layering

```text
UI (existing Next.js App Router)
  → Server Actions / Route Handlers (later phases)
  → Application modules (`src/modules/*`)
  → Repositories / Prisma (`src/lib/db`)
  → PostgreSQL
```

Never call Prisma from presentational React components.

## Key directories

| Path                   | Purpose                                                 |
| ---------------------- | ------------------------------------------------------- |
| `src/app/`             | Routes and UI (unchanged visually)                      |
| `src/modules/`         | Domain services (payments, notifications, AI, analytics) |
| `src/modules/analytics/` | Phase 11 reporting aggregates (tenant-scoped)          |
| `src/lib/db/`          | Prisma singleton                                        |
| `src/lib/auth/`        | NextAuth config, permissions, tenant context            |
| `src/lib/errors/`      | `AppError` hierarchy                                    |
| `src/lib/logger/`      | Structured JSON logging                                 |
| `src/lib/events/`      | In-process domain events (BullMQ wiring later)          |
| `src/lib/redis/`       | Optional Redis client                                   |
| `src/lib/storage/`     | Storage abstraction + upload limits                     |
| `src/lib/security/`    | Tenant scope, rate-limit stub                           |
| `src/workers/`         | BullMQ queue/worker entry                               |
| `src/config/env.ts`    | Zod-validated environment                               |
| `prisma/schema.prisma` | Multi-tenant data model                                 |

## Multi-tenancy

- `User.tenantId` and tenant-owned entities carry `tenantId`.
- `assertSameTenant` and `tenantWhere` enforce server-side scope (`src/lib/security/tenant-scope.ts`).
- Client-supplied tenant IDs are never trusted.

## Background processing

- Redis URL optional in development; required for workers in production.
- `src/workers/queues.ts` defines queue names; `src/workers/run.ts` is the worker process entry (`npm run worker`).

## Instrumentation

`src/instrumentation.ts` validates environment on Node server startup (strict in production, relaxed during `next build`).

See also: [database.md](./database.md), [security.md](./security.md), [api.md](./api.md), [implementation-roadmap.md](./implementation-roadmap.md).
