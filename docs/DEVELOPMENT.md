# Development

## Database (Neon)

1. Set `DATABASE_URL` in `.env` (never commit).
2. `npm run db:migrate:deploy` — apply migrations.
3. `npm run db:seed` — dev users and sample order.

## Auth test accounts

Password for all seeded users: **`DevPassword123!`**

Tenant slug: **`elanskin-dev`** (via `DEFAULT_TENANT_SLUG` in `.env`)

See [authentication.md](./authentication.md) for emails.

## Tests

```bash
npm test
RUN_DB_INTEGRATION=1 npm test -- src/test/phase1/db-isolation.integration.test.ts
```

Integration tests hit your configured `DATABASE_URL`.

## Commands

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```
