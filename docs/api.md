# API layer (Phase 0)

## Current state

There is **no** full REST catalog yet. The existing UI uses:

- Mock services under `src/services/` (storefront, admin, assistant)
- Server actions in `src/app/actions/` that call mocks or compute checkout totals client-side rules

Phase 0 adds **infrastructure only**. Contract expectations for future endpoints are documented in [backend-api-contracts.md](./backend-api-contracts.md).

## Implemented HTTP routes (foundation)

| Route                              | Purpose                     |
| ---------------------------------- | --------------------------- |
| `GET/POST /api/auth/[...nextauth]` | Auth.js session and sign-in |

## Planned pattern (later phases)

```text
Route Handler / Server Action
  → validate input (Zod)
  → resolve session + tenant context
  → authorize(permission)
  → module service
  → repository (Prisma)
  → emit domain event → queue job
```

## Error shape

JSON errors should follow `AppError.toJSON()`:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message"
  }
}
```

## Webhooks

`WebhookEvent` model and Paystack verification are **not** implemented in Phase 0.
