# Authorization (Phase 1)

## Roles

`CUSTOMER`, `STAFF`, `ADMIN`, `SUPER_ADMIN` (Prisma enum).

## Permissions

Defined centrally in `src/lib/auth/permissions.ts` using dotted names (`products.read`, `orders.read_own`, …).

Use:

```typescript
import { authorize, requireRequestContext } from "@/lib/auth/request-context";

const ctx = await requireRequestContext();
authorize(ctx, "orders.read");
```

Do **not** scatter `if (user.role === "ADMIN")` in feature code.

## Request context

`RequestContext` (`src/lib/auth/request-context.ts`):

- `userId`, `email`, `role`, `tenantId` — from session + DB status check
- `permissions` — derived from role
- `customerId` — resolved for `CUSTOMER` users only

Helpers:

- `getRequestContext()` / `requireRequestContext()`
- `requireCustomerRequestContext()` — account/checkout customer flows

Lower-level helpers in `src/lib/auth/authorize.ts`: `requireAuthenticatedUser`, `authorizePermission`, `requireTenantAccess`, `requireStaff`.

## Customer vs staff permissions

- Staff permissions (`orders.read`, `products.read`, …) are tenant-scoped in services.
- Customer permissions (`orders.read_own`, …) require **ownership** checks in repositories/services (customerId + tenantId).

## Admin access

- Middleware + `admin/layout.tsx` require staff roles (`canAccessAdminArea`).
- Customers receive `/access-denied` when hitting `/admin/*`.

## Adding a new permission

1. Add entry to `Permissions` in `permissions.ts`.
2. Call `authorize(ctx, "your.permission")` in the server action or route handler.
3. Enforce tenant scope in the service/repository layer.
4. Add regression tests in `src/test/phase1/`.

## Protecting a new route

```text
Route Handler / Server Action
  → requireRequestContext() or requireCustomerRequestContext()
  → authorize(context, permission)
  → Service method (tenant + ownership queries)
  → Safe DTO to UI
```

Middleware is a coarse gate only; always authorize again in the handler/service.
