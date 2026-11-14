# Frontend ↔ Backend API Contracts

This document describes the **typed service boundaries** the storefront UI expects. Implement these as Next.js Route Handlers, server actions backed by Prisma, or internal modules—do not invent public URLs until the backend team confirms routing.

All customer-facing prices, totals, inventory limits, and order state **must be computed server-side**. Client payloads carry identifiers and quantities only.

---

## Catalog (`CatalogService` — `src/services/catalog.service.ts`)

| Operation           | Input                                                                        | Output                                            |
| ------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------- |
| `listProducts`      | filters: `q`, category, skinType, concern, price range, sort, page, pageSize | `{ items: Product[], total, page, pageSize }`     |
| `getProductBySlug`  | slug                                                                         | `Product \| null`                                 |
| `getProductById`    | id                                                                           | `Product \| null`                                 |
| `getFilterMetadata` | —                                                                            | categories, skin types, concerns for shop filters |

**Backend:** PostgreSQL product catalog, search (full-text or dedicated search service), tenant scoping.

---

## Cart pricing (`buildCartSummary` — `src/services/cart.service.ts`)

| Operation | Input                                                   | Output                                                          |
| --------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| Summary   | `CartLineInput[]` (productId + quantity), delivery flag | `CartSummary` with server unit prices, stock caps, delivery fee |

**Backend:** Validate product IDs, stock, and price at read time; reject unknown IDs.

---

## Orders (`OrderService` — `src/services/order.service.ts`)

| Operation               | Input                                    | Output                                  |
| ----------------------- | ---------------------------------------- | --------------------------------------- |
| `createOrder`           | checkout payload + authoritative summary | order id, status, payment status        |
| `getOrder`              | order id (authorized)                    | order detail for confirmation / account |
| `listOrdersForCustomer` | customer session                         | order summaries                         |

**Backend:** Paystack initialize + verify + webhooks; idempotent order creation; httpOnly session/cookie or auth token binding.

---

## Account (`AccountService` — `src/services/account.service.ts`)

| Operation            | Input                 | Output                                         |
| -------------------- | --------------------- | ---------------------------------------------- |
| `getProfile`         | session               | profile fields                                 |
| `updateProfile`      | validated profile     | updated profile                                |
| `getAddresses`       | session               | address list                                   |
| `getPreferences`     | session               | marketing / routine preferences                |
| `updatePreferences`  | validated preferences | persisted preferences                          |
| `getRecommendations` | session               | product ids or slugs (from routine/AI history) |

**Backend:** Authentication required; no client-side-only profile as source of truth.

---

## Routine (`RoutineService` — `src/services/routine.service.ts`)

| Operation   | Input                                     | Output                               |
| ----------- | ----------------------------------------- | ------------------------------------ |
| `recommend` | `RoutineAnswers` (6 questionnaire fields) | steps + product list + guidance note |

**Backend:** May remain rules-based initially; optional ML later. Must use catalog service for product resolution.

---

## Assistant (`AssistantService` — `src/types/assistant.ts`)

| Operation           | Input                               | Output                                                                                |
| ------------------- | ----------------------------------- | ------------------------------------------------------------------------------------- |
| `startConversation` | optional `AssistantCustomerContext` | conversationId, welcome message, suggested prompts, quick actions                     |
| `sendMessage`       | conversationId, message, context    | structured `AssistantChatMessage` (text, recommendations, comparison, or error codes) |

**Error codes:** `timeout`, `rate_limit`, `api_failure`, `empty_response`, `unavailable`, `invalid_recommendation`, `product_unavailable`.

**Backend:** AI provider with **tool calls** into controlled APIs (catalog search, order status lookup by authenticated customer)—never raw SQL or shell from the model. Sanitize all text; UI renders plain text and structured cards only.

---

## Admin (`AdminService` — `src/services/admin.service.ts`)

Mock implementation: `mockAdminService` / in-memory product store. Replace with authenticated Route Handlers.

| Operation                                      | Purpose                                                     |
| ---------------------------------------------- | ----------------------------------------------------------- |
| `getDashboard`                                 | KPI cards, recent orders/leads, mock chart series           |
| `listOrders` / `getOrder`                      | Ops order list, detail, timeline                            |
| `listProducts` / CRUD / `archiveProduct`       | Catalog admin (must sync to storefront catalog + inventory) |
| `listInventory` / `adjustStock` / transactions | Stock ledger                                                |
| `listCustomers` / `getCustomer`                | CRM profiles                                                |
| `listLeads` / `getLead`                        | Pipeline, conversion                                        |
| `listConversations` / `getConversation`        | WhatsApp/email/AI threads                                   |
| `getAiOverview`                                | AI ops metrics (no secrets)                                 |
| `listAutomations` / CRUD / enable              | Workflow definitions + run history (BullMQ)                 |
| `getAnalytics`                                 | Reporting aggregates                                        |
| `getSettings`                                  | Business, integrations, team RBAC                           |

**Backend:** Every admin mutation requires server authorization (RBAC). Frontend role display is UX only.

---

## Not yet represented in UI services (required for full platform)

These areas still need **production APIs** beyond the admin UI mock:

- **CRM / Leads:** list, detail, stage transitions, assign owner, convert to customer
- **Conversations:** WhatsApp/email thread list, message send (queued)
- **Automations:** workflow definition CRUD, trigger types, run history, BullMQ job status
- **Analytics:** aggregated KPIs (revenue, conversion, funnel)—paginated queries, not full dumps on load
- **Admin catalog / inventory:** product CRUD, stock adjustments, audit log
- **Settings / team:** business profile, Paystack keys (server-only), roles and permissions

Reference product scope: `.cursor/docs/product-requirements.md`, `.cursor/docs/architecture.md`.

---

## Integrations (server-only secrets)

| Integration      | Frontend exposure                                               |
| ---------------- | --------------------------------------------------------------- |
| Paystack         | `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` only; charge/verify on server |
| Email / WhatsApp | No client keys; outbound via workers                            |
| Redis / BullMQ   | Not accessed from browser                                       |
| AI providers     | Server-side only                                                |
