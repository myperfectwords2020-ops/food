# Data fetching (TanStack Query + Next.js App Router)

This document describes how server state is fetched and cached in the storefront and admin UI (Phase 5.5).

## When to use what

| Layer | Use for |
| --- | --- |
| **Server Components** | Initial page data, SEO, auth-gated layouts, anything that does not need browser interactivity |
| **TanStack Query** | Client-side server state that changes after mount: cart, checkout totals, admin tables/filters, mutations |
| **Local React state** | UI-only state: open dialogs, hover, form fields before submit, debounced input staging |

TanStack Query manages **client-side server state**; it does not replace PostgreSQL, Next.js Server Components, authentication, or backend authorization.

## QueryClient

- Created once per browser session in `AppQueryProvider` (`src/lib/query/query-provider.tsx`) via `makeQueryClient()` (`src/lib/query/query-client.ts`).
- Defaults: 60s stale time, 5m garbage collection, no refetch on window focus, safe retry (no retry on 401/403/404/422/409/429).
- Tests use `createTestQueryClient()` / `TestQueryProvider` in `src/test/test-utils.tsx`.

## Query keys

Central factories in `src/lib/query/query-keys.ts`:

- `cartKeys` — bootstrap, server cart, guest summary
- `checkoutKeys` — checkout summary (state + cart lines fingerprint)
- `adminKeys` — orders, products, customers, inventory, delivery rates, dashboard, analytics, leads

Legacy `queryKeys` re-exports the same keys for gradual migration.

Cart line arrays are normalized with `cartLinesKey()` so key order is stable.

## API boundaries

UI and hooks call **server actions** or route handlers in `src/app/actions/*`, not Prisma directly. Responses are typed in `src/types/*` and module services.

Mock admin data is loaded through `admin-queries` actions and labeled in the UI (`AdminMockBanner`).

## Mutations

- Cart sync: `useSyncCartItemMutation` — optimistic `setQueryData` on `cartKeys.server()`, rollback on error, authoritative summary on success.
- Admin inventory/delivery: invalidate only the relevant `adminKeys.*` query after success.

Never treat mutation cache updates as security: prices, inventory, payment status, and permissions are always re-validated on the server.

## Cache invalidation

Prefer targeted invalidation:

```ts
queryClient.invalidateQueries({ queryKey: adminKeys.inventory() });
```

Avoid blanket `queryClient.invalidateQueries()` unless logging out (`queryClient.clear()`).

## Optimistic updates

Used where UX benefits and rollback is straightforward (server cart line quantities). Guest cart updates local state + `localStorage` immediately; summary refetches via query.

## Search and debouncing

- **Checkout**: shipping state and cart lines are debounced (`useDebouncedValue`) before `checkoutKeys` updates.
- **Admin lists**: filters apply on form submit (URL search params), not per keystroke — avoids request storms.

## Pagination

Admin list hooks include `page` and bounded `pageSize` (typically 10) in query keys. `parseAdminPage` and `paginateAdminList` cap page size on the client; backend services enforce limits for real data.

## Prefetching and SSR hydration

- Most catalog pages remain Server Components with direct service calls.
- Helpers in `src/lib/query/hydration.ts` support optional `prefetchIntoState` + `HydrationBoundary` when a route needs hydrated client queries.
- Do not prefetch entire catalogs; prefetch only high-probability next views (e.g. product detail on intentional hover) when hooks exist.

## Errors and retry

Use `getQueryErrorMessage()` for user-facing copy. Queries retry at most once for transient failures; mutations do not retry.

## Authentication and logout

On sign out, `SignOutButton` calls `queryClient.clear()` before `logoutAction()` so cached orders, cart, and admin data are not shown to the next user on a shared device.

## Multi-tenant

The server resolves tenant from session. Do not pass client-supplied `tenantId` into query functions as authorization. After tenant-changing auth events, clear or invalidate user-specific queries.

## Security

- No secrets in query data or `NEXT_PUBLIC_*` misuse.
- Cached prices, roles, and payment state are **hints for UX only**; checkout and Paystack flows recompute and verify on the server.

## Examples

```tsx
// Read cart in a client component
import { useCart } from "@/modules/cart/queries/use-cart";

// Admin orders with URL-driven filters
import { useAdminOrdersQuery } from "@/hooks/queries/admin/use-admin-orders";
```

New features should add keys to `query-keys.ts`, stale times to `stale-times.ts`, and server actions in the appropriate module — not fetches inside presentational components.
