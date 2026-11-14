# PHASE 11 — ANALYTICS, REPORTING & BUSINESS INTELLIGENCE

You are continuing the production implementation of the skincare e-commerce and AI automation platform.

## Critical instructions

- Build on Phases 0–10.
- Do not redesign the existing UI.
- The existing Lovable/Cursor UI is the visual source of truth.
- Preserve existing layouts, components, colors, typography, spacing, and responsive behavior.
- Read the existing codebase, Prisma schema, documentation, and `.cursor/rules/*.mdc` before implementation.
- Reuse existing services, domain events, queues, authorization, and TanStack Query patterns.
- Do not duplicate business logic.
- Do not use mock data for production analytics.
- Do not hardcode chart values or KPI totals.
- Do not expose raw Prisma models or sensitive customer information.
- Do not begin Phase 12 automatically.

## 1. Objective

Implement production analytics and reporting for:

1. Revenue and sales.
2. Orders and payments.
3. Products and inventory.
4. Customers and customer lifecycle.
5. Leads and conversion.
6. AI assistant performance.
7. Conversations and human handoff.
8. Automation execution.
9. Notification delivery.
10. Business performance over time.

Connect the existing `/admin/analytics` route to real data.

The analytics system must be accurate, tenant-isolated, permission-protected, performant, and testable.

## 2. Inspect existing implementation

Before coding, inspect:

- Prisma schema and database indexes.
- Order, OrderItem, Payment, Product, and Inventory models.
- Customer and CustomerLifecycle services.
- Lead and CRM services.
- AI conversations and messages.
- Automation and AutomationRun models.
- Notification and delivery models.
- Domain events and event-processing infrastructure.
- Existing admin analytics UI.
- Existing date-range and filtering components.
- Authorization and tenant-context implementation.
- TanStack Query setup.
- Existing logging and testing conventions.

Identify which data already exists and which metrics can be calculated reliably.

Do not invent metrics unsupported by the stored data.

## 3. Analytics architecture

Separate analytics into three layers:

**Data sources**
- PostgreSQL transactional records.
- Existing domain events and execution records.
- Existing queue and delivery records where applicable.

**Analytics services**
- RevenueAnalyticsService
- OrderAnalyticsService
- ProductAnalyticsService
- CustomerAnalyticsService
- LeadAnalyticsService
- AIAnalyticsService
- ConversationAnalyticsService
- AutomationAnalyticsService
- NotificationAnalyticsService

**Presentation**
- Typed analytics DTOs.
- Protected API routes or server actions following existing conventions.
- TanStack Query hooks.
- Existing admin charts, cards, and tables.

Do not put complex analytics queries directly inside React components or route handlers.

Do not make browser-side queries directly against PostgreSQL.

## 4. Shared analytics filters

Create a validated analytics filter contract supporting, where appropriate:

- Start date.
- End date.
- Time zone.
- Comparison period.
- Product.
- Order status.
- Customer lifecycle.
- Lead source.
- Automation.
- Notification channel.

Use sensible defaults, such as the last 30 days.

Validate date ranges and enforce a maximum query window for expensive reports.

Use the tenant's configured time zone if available. Otherwise, document and consistently apply the application's configured default.

Use half-open date ranges where practical: start inclusive, end exclusive.

Do not mix UTC timestamps and local calendar dates inconsistently.

## 5. Revenue and sales analytics

Implement metrics supported by the existing payment and order records:

- Gross order value.
- Verified paid revenue.
- Number of paid orders.
- Average order value.
- Revenue over time.
- Orders over time.
- Revenue by product.
- Revenue by category, if categories exist.
- Revenue by payment status.
- Refund totals, if refund data is available.
- Cancelled order counts.
- Failed payment counts.

Define each metric clearly.

Important rules:

- Do not count pending payments as revenue.
- Do not treat a payment initialization or browser callback as proof of payment.
- Use verified payment records and the existing payment state machine.
- Account for refunds and partial refunds only if the data model supports them.
- Avoid double-counting multiple payment attempts for one order.
- Use the correct currency and integer minor-unit calculations.
- Never sum amounts from different currencies into a misleading total.
- Do not label gross sales as net profit.
- Do not calculate profit unless reliable cost data exists.

Document the exact business definition of each financial KPI.

## 6. Order analytics

Implement:

- Orders by status.
- Orders over time.
- Average order value.
- Payment success rate.
- Cancellation rate.
- Delivery rate, if delivery status is tracked.
- Order processing duration, if timestamps support it.
- Repeat-order rate, where customer identity and history are reliable.

Use consistent denominators.

For example, clearly define whether payment success rate uses payment attempts or distinct orders.

Do not divide by zero or display misleading percentages for insufficient data.

## 7. Product analytics

Implement:

- Best-selling products.
- Units sold.
- Revenue by product.
- Product sales over time.
- Products with no sales in a selected period.
- Inventory levels.
- Low-stock products.
- Out-of-stock products.
- Product performance by category or concern where reliable catalog relationships exist.

Distinguish sales quantity from current inventory.

Use order item snapshots for historical product names and prices where appropriate.

Avoid treating cancelled or unpaid orders as completed sales.

## 8. Customer analytics

Implement:

- Total customers.
- New customers over time.
- Repeat customers.
- Customer lifecycle distribution.
- Customer acquisition trends.
- Repeat purchase rate.
- Average orders per customer.
- Customer retention indicators, where the underlying data supports them.

Define customer counting rules.

Do not count anonymous visitors as registered customers.

Do not infer retention or customer lifetime value from incomplete records.

If lifetime value is implemented, explicitly document its calculation and limitations.

## 9. Lead and CRM analytics

Implement:

- Leads created over time.
- Leads by source.
- Leads by status.
- Qualified lead count.
- Converted lead count.
- Lead conversion rate.
- Time to qualification, where timestamps support it.
- Time to conversion, where timestamps support it.
- Lead assignment and workload summaries, subject to permissions.

Use the existing LeadService and lifecycle rules as the source of truth.

Prevent duplicate leads from inflating counts.

Define conversion rate precisely and avoid counting the same lead multiple times.

Do not expose individual customer contact details in aggregate reports.

## 10. AI assistant analytics

Implement measurable AI usage metrics such as:

- Conversations started.
- Customer messages.
- AI responses.
- Conversations requiring human handoff.
- Handoff rate.
- Conversations resolved.
- AI tool invocation counts.
- Tool failure counts.
- Provider failure counts, if recorded.
- AI response latency, if reliably measured.
- Recommendation interactions, if recorded.
- Add-to-cart actions originating from the assistant, if attribution exists.

Distinguish between:
- Conversation count.
- Message count.
- Tool invocation count.
- Successful business actions.

Do not claim that AI improved sales unless the system has reliable attribution supporting that conclusion.

Do not store or display raw conversation contents in aggregate analytics.

## 11. Conversation and support analytics

Implement:

- Conversations by status.
- Handoff requests.
- Human-assigned conversations.
- Resolved conversations.
- Average time to first human reply, if timestamps are sufficient.
- Average resolution time, if timestamps are sufficient.
- Unresolved conversation backlog.
- Staff workload summaries, subject to permissions.

Exclude or separately identify automated messages when calculating human response time.

Document the exact start and end events used for duration metrics.

Do not infer SLA compliance unless SLA rules exist.

## 12. Automation analytics

Implement:

- Active automations.
- Automation runs.
- Completed runs.
- Failed runs.
- Cancelled runs.
- Run success rate.
- Run failure rate.
- Retry counts.
- Average execution duration.
- Failures by automation and step.
- Delayed or waiting executions.

Use the existing AutomationRun and step-execution records.

Avoid double-counting retries as separate business executions.

Distinguish an automation run from an individual worker attempt.

Do not expose secrets or complete sensitive workflow context.

## 13. Notification analytics

Implement:

- Notifications queued.
- Notifications sent.
- Notifications delivered, where provider receipts exist.
- Failed notifications.
- Delivery rate.
- Failure rate.
- Results by channel.
- Results by notification type.
- Provider error summaries.

Clearly distinguish:
- Queued.
- Sent.
- Delivered.
- Failed.

Do not claim a message was delivered solely because the provider accepted the request.

Do not count duplicate webhook events as separate deliveries.

## 14. Data correctness and financial reconciliation

Use authoritative records and explicit metric definitions.

For financial analytics:

- Use verified payment status.
- Apply existing refund rules.
- Prevent duplicate payment counting.
- Use integer minor units.
- Keep currencies separate.
- Define how cancelled orders are treated.
- Use consistent timestamps and date boundaries.

Where a metric cannot be calculated reliably, omit it or label it unavailable.

Do not silently substitute estimates for actual values.

## 15. API and DTO design

Create typed analytics DTOs for each report.

Examples:

- RevenueSummaryDTO
- SalesTrendDTO
- OrderStatusBreakdownDTO
- ProductPerformanceDTO
- CustomerMetricsDTO
- LeadFunnelDTO
- AIUsageMetricsDTO
- ConversationMetricsDTO
- AutomationMetricsDTO
- NotificationMetricsDTO

Return only fields required by the UI.

Validate request parameters on the server.

Use standardized error responses.

Require authentication, tenant context, and the relevant analytics permissions.

Never return raw database records.

## 16. Authorization and multi-tenancy

Define permissions using the existing authorization system, for example:

- ANALYTICS_READ
- ANALYTICS_REVENUE_READ
- ANALYTICS_CUSTOMER_READ
- ANALYTICS_AI_READ
- ANALYTICS_AUTOMATION_READ

Adapt these to the existing permission conventions rather than creating conflicting duplicates.

Ensure:

- Every query is scoped to the authenticated tenant.
- Staff only access reports permitted by their role.
- Customers cannot access admin analytics.
- Cross-tenant queries are impossible.
- Request parameters cannot override tenant context.

Apply least privilege to revenue and customer-level reports.

## 17. Performance and database strategy

Optimize analytics for production:

- Use database-side aggregation.
- Select only necessary fields.
- Avoid loading full order, customer, or message histories into application memory.
- Avoid N+1 queries.
- Use indexes supported by actual query patterns.
- Apply pagination to detailed tables.
- Bound date ranges for expensive queries.
- Avoid running every analytics query on every dashboard render.
- Use parallel requests only where they reduce latency safely.

Inspect query plans for expensive queries where practical.

Do not introduce a data warehouse or complex event-streaming platform unless actual scale requires it.

## 18. Caching

Use caching selectively.

- Cache safe aggregate results when appropriate.
- Scope cache keys by tenant, date range, time zone, and relevant filters.
- Prevent cross-tenant cache leakage.
- Invalidate or expire results when relevant data changes.
- Do not cache private customer-level information in a global cache.
- Do not sacrifice financial correctness for cache speed.

If the existing architecture has no suitable analytics cache, begin with efficient database aggregation and introduce caching only when justified.

## 19. Historical data and event reliability

Use existing transactional records for historical metrics whenever possible.

Do not assume newly introduced event tracking contains complete historical data.

If an analytics metric requires events that were not previously stored:

- Identify the historical data limitation.
- Use a reliable existing source if available.
- Otherwise report that metric only for the supported period.
- Do not fabricate historical events.

If materialized aggregates are necessary, build them with idempotent processing, reconciliation, and a documented backfill strategy.

Do not introduce duplicate analytics records from repeated event processing.

## 20. Admin dashboard integration

Connect `/admin/analytics` to real analytics services.

Preserve the existing visual design.

Ensure:

- KPI cards show actual values.
- Charts use real date-series data.
- Filters change the corresponding results.
- Loading states use the existing design.
- Empty states explain when no data exists.
- Errors are displayed safely.
- Currency is formatted correctly.
- Percentages and durations have consistent formatting.
- Charts remain responsive.
- Tables use pagination where necessary.

Do not display fabricated positive growth percentages when no valid comparison period exists.

If comparison data is unavailable, display an appropriate empty or unavailable state.

## 21. TanStack Query

Follow the existing data-fetching architecture.

Create query-key factories and hooks as appropriate, for example:

- useRevenueAnalytics
- useSalesTrends
- useOrderAnalytics
- useProductAnalytics
- useCustomerAnalytics
- useLeadAnalytics
- useAIAnalytics
- useConversationAnalytics
- useAutomationAnalytics
- useNotificationAnalytics

Use stable query keys containing relevant filters.

Use sensible stale times for analytics data.

Avoid excessive polling and unnecessary refetching.

Do not cache analytics across tenants.

## 22. Data export

If the existing UI requires exports, implement secure CSV export for permitted reports.

Requirements:

- Server-side authorization.
- Tenant-scoped queries.
- Export limits.
- Safe CSV escaping.
- Protection against spreadsheet formula injection.
- No secrets or unnecessary PII.
- Clear handling of large exports.

Do not build a complex reporting designer in this phase.

If export UI does not exist, prioritize analytics correctness and dashboard integration over introducing a new export interface.

## 23. Auditability and observability

Log safe operational metadata for:

- Analytics query failures.
- Slow reports.
- Unauthorized analytics access.
- Export requests.
- Aggregation failures.

Avoid logging complete customer records or sensitive conversation contents.

Where practical, include request or correlation IDs.

Do not write an audit record for every normal dashboard query unless the existing security policy requires it; use appropriate operational logging.

## 24. Testing

Add unit tests for:

- Metric definitions.
- Revenue calculations.
- Currency separation.
- Refund handling.
- Payment deduplication.
- Date-range boundaries.
- Time-zone behavior.
- Conversion-rate denominators.
- Duration calculations.
- Percentage calculations.
- Empty-data behavior.

Add integration tests for:

- Revenue analytics API.
- Order analytics.
- Product analytics.
- Customer analytics.
- Lead funnel.
- AI usage.
- Conversation metrics.
- Automation runs.
- Notification delivery.
- Date filters.
- Tenant isolation.
- Authorization.

Add regression tests proving:

- Unpaid orders do not count as paid revenue.
- Duplicate payment attempts do not inflate distinct-order counts.
- Refunds follow documented rules.
- Different currencies are never combined incorrectly.
- One tenant cannot query another tenant's metrics.
- Unauthorized users cannot access restricted reports.
- Missing historical data is not fabricated.

Run the project's applicable:

- TypeScript typecheck.
- Lint.
- Prisma validation and generation if schema changes.
- Unit tests.
- Integration tests.
- Production build.

Fix failures rather than merely listing them.

## 25. Documentation

Create or update:

`docs/analytics.md`

Document:

- Available reports.
- Metric definitions.
- Revenue and refund rules.
- Currency handling.
- Date and time-zone rules.
- Conversion-rate definitions.
- AI and support metrics.
- Automation and notification metrics.
- Authorization.
- Tenant isolation.
- Caching.
- Historical-data limitations.
- Performance considerations.
- Export behavior, if implemented.

Update `docs/architecture.md` and `docs/implementation-roadmap.md` where appropriate.

## 26. Out of scope

Do not implement:

- Predictive AI analytics.
- Machine-learning forecasting.
- A/B testing platform.
- Advanced attribution modeling.
- External data warehouse integration.
- Customer-facing analytics dashboards.
- Complex custom report builders.
- Phase 12 production hardening as a separate project.

Do not start Phase 12 automatically.

## 27. Final validation

Before completing:

1. Verify every dashboard KPI uses real data.
2. Verify metric definitions are documented.
3. Verify payment and refund calculations.
4. Verify currencies are handled correctly.
5. Verify filters affect results.
6. Verify date boundaries and time zones.
7. Verify tenant isolation.
8. Verify authorization.
9. Verify historical-data limitations.
10. Verify database query performance.
11. Verify TanStack Query integration.
12. Verify loading, empty, and error states.
13. Verify no fabricated chart values remain.
14. Verify no sensitive data is exposed.
15. Verify existing UI remains visually intact.
16. Run all applicable tests and the production build.

## Final report

Provide:

### Implemented
- Sales and revenue analytics.
- Order analytics.
- Product analytics.
- Customer analytics.
- CRM and lead analytics.
- AI analytics.
- Conversation analytics.
- Automation analytics.
- Notification analytics.
- Admin dashboard integration.
- Exports, if implemented.

### Metric definitions
Document important financial and conversion calculations.

### Database and performance
Report relevant queries, indexes, caching, and performance considerations.

### Security
Report authorization, tenant isolation, and privacy protections.

### Testing
List commands executed and their actual results.

### Documentation
List documents created or updated.

### Remaining issues
List only genuine blockers, unsupported metrics, and provider/data limitations.

Then STOP. Do not begin Phase 12 automatically.