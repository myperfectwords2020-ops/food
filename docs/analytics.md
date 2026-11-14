# Analytics (Phase 11)

## Overview

Production analytics for the admin dashboard and `/admin/analytics` use PostgreSQL aggregates scoped by tenant. Client components load data via server actions and TanStack Query (`useAdminAnalyticsQuery`, `useAdminDashboardQuery`).

## Authorization

- Permission: `analytics.read` (ADMIN and SUPER_ADMIN).
- Every query uses `requireTenantId()` — staff cannot override tenant via query params.
- Customers cannot access admin analytics routes (middleware + role checks).

## Date ranges

Presets: `7d`, `30d`, `90d` (URL `?range=`).

- Boundaries: **UTC calendar days**, half-open interval `[start, end)`.
- Default comparison: immediately prior period of equal length.
- Labels reference application default timezone `Africa/Lagos` for display notes only.

## Revenue KPIs

| Metric                    | Definition                                                                                                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Verified paid revenue** | Sum of **SUCCEEDED** `Payment.amountMinor` with `paidAt` in range, **one payment per order** (latest `paidAt` wins). Display uses **NGN** major units via `fromMinorUnits`. |
| **Paid orders**           | Distinct orders with a counted succeeded payment in range.                                                                                                                  |
| **AOV**                   | Verified paid revenue (NGN) ÷ paid orders.                                                                                                                                  |
| **Revenue trend**         | Daily buckets by `paidAt` date (UTC).                                                                                                                                       |

Rules:

- Pending/processing payments are **not** revenue.
- Multiple currencies are tracked separately; dashboard headline uses NGN only.
- Refunds: `REFUNDED` payment status is excluded from succeeded totals; partial refund modeling is not applied unless extended in payments domain.

## Orders

- **Orders by status**: orders **created** in range, grouped by `Order.status`.
- **Payment success rate**: succeeded payment attempts ÷ all payment attempts created in range.
- **Cancellation rate**: cancelled orders created in range ÷ all orders created in range.

## Products

- Sales from `OrderItem` lines on orders with a **SUCCEEDED** payment in range (excluding cancelled/failed orders).
- Inventory: active catalog products vs `lowStockThreshold` and zero stock.

## Customers

- **Total customers**: all `Customer` rows for tenant.
- **New customers**: `Customer.createdAt` in range.
- **Returning**: customers with ≥2 paid/processing/shipped/delivered orders.
- **Lifecycle funnel**: current `Customer.lifecycle` distribution (snapshot, not cohort flow).

## Leads

- **Leads created**: `Lead.createdAt` in range.
- **Qualified**: status `QUALIFIED` or `qualifiedAt` set (same creation window).
- **Conversion rate**: converted leads ÷ leads created in range (converted = status `CONVERTED` or `convertedAt` set).

## Product engagement & attribution

Stored in `AnalyticsEvent` (migration `20261013120000_analytics_events`):

| Event                            | Trigger                                          |
| -------------------------------- | ------------------------------------------------ |
| `PRODUCT_VIEW`                   | Product detail page load                         |
| `STOREFRONT_ADD_TO_CART`         | Add to bag / quick add (storefront)              |
| `ASSISTANT_ADD_TO_CART`          | Quick add from assistant cards                   |
| `ASSISTANT_RECOMMENDATION_CLICK` | Assistant product link click                     |
| `ASSISTANT_ORDER_ATTRIBUTED`     | Paid order with assistant touch in prior 30 days |

Conversion % on engagement table = purchases ÷ views (same period).

## AI & conversations

- AI assistant channel conversations and message counts from `Conversation` / `Message`.
- Handoffs: conversations with `handoffRequestedAt` in range.
- Recommendation clicks and assistant-attributed orders from `AnalyticsEvent`.

## Refunds

- **Refunds**: `Payment.status = REFUNDED` with `updatedAt` in range (one row per order).
- **Net revenue (NGN)**: verified paid NGN in range minus refunded NGN in range (not below zero).
- Pending refunds without `REFUNDED` status are excluded until payment domain marks them.

## CSV export

- Admin analytics **Export CSV** → `exportAdminAnalyticsCsvAction` (requires `analytics.read`).
- Max 500 product/lead rows per section; formula injection neutralized in cells.

## Automations

- Runs from `AutomationRun` with `startedAt` in range.
- Success rate: `COMPLETED` ÷ runs per automation.

## Notifications

- Excludes `IN_APP` channel.
- Counts by `Notification.status` and channel for records **created** in range.
- **Delivered** requires provider receipt (`deliveredAt` / status `DELIVERED`); `SENT` is provider accept only.

## Services

Located under `src/modules/analytics/`:

- `analytics-filters.ts`
- `revenue-analytics.service.ts`
- `order-analytics.service.ts`
- `product-analytics.service.ts`
- `customer-analytics.service.ts`
- `lead-analytics.service.ts`
- `ai-analytics.service.ts`
- `conversation-analytics.service.ts`
- `automation-analytics.service.ts`
- `notification-analytics.service.ts`
- `analytics-orchestrator.service.ts`

Entry: `getAnalyticsSnapshot`, `getLiveDashboard` / `getLiveAnalytics` in `src/services/live-admin-analytics.service.ts`.

## Performance

- Parallel service calls per dashboard load.
- Bounded presets (max 90 days in UI).
- Slow reports (>3s) log `analytics_slow_report`.
- No cross-tenant cache in Phase 11.

## Testing

Unit tests: `src/test/phase11/analytics-metrics.test.ts` (dedupe, currency separation, date windows).
