# System Architecture

## 1. Architecture Goal

The application is a production-ready, multi-tenant-capable AI commerce and automation platform for skincare businesses.

The architecture should allow the initial skincare business to operate independently while keeping the system extensible enough to support additional businesses in the future.

---

# 2. High-Level Architecture

```text
                         CUSTOMER
                            │
                            ▼
                    ┌───────────────┐
                    │   Next.js     │
                    │   Frontend    │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Application   │
                    │    Layer      │
                    └───────┬───────┘
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
        Commerce          AI Layer      CRM/Lead
          Layer                            Layer
             │              │              │
             └──────────────┼──────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ PostgreSQL    │
                    └───────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Redis / Queue │
                    └───────┬───────┘
                            │
                            ▼
                    Background Workers
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
          Email          WhatsApp       Analytics
```

---

# 3. Technology Stack

## Frontend

```text
Next.js
TypeScript
React
Tailwind CSS
shadcn/ui
```

## Backend

```text
Next.js Server Components
Next.js Server Actions
Next.js Route Handlers
TypeScript
```

The application should use clear service boundaries even when backend code lives within the Next.js project.

---

# 4. Database

Use PostgreSQL.

Use Prisma as the ORM.

The database is the source of truth for:

- Products
- Customers
- Orders
- Payments
- Leads
- Conversations
- Automations
- Tenant configuration

Do not duplicate authoritative business data in Redis.

Redis should be used for temporary state, caching, rate limiting, and background job infrastructure.

---

# 5. Core Domain Modules

The application should be separated into domain modules.

```text
src/
├── modules/
│   ├── auth/
│   ├── tenants/
│   ├── customers/
│   ├── products/
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   ├── payments/
│   ├── leads/
│   ├── conversations/
│   ├── ai/
│   ├── automations/
│   ├── notifications/
│   └── analytics/
```

Each module should contain its own:

```text
service
validation
types
repository/data access
business logic
tests
```

Avoid placing all business logic inside API route handlers.

---

# 6. Recommended Project Structure

```text
app/
├── (store)/
├── account/
├── admin/
└── api/

src/
├── modules/
├── lib/
├── components/
├── jobs/
└── types/

prisma/
├── schema.prisma
└── seed.ts

docs/

tests/

.cursor/
└── rules/
```

---

# 7. Request Flow

A typical request should follow:

```text
HTTP Request
     ↓
Authentication
     ↓
Authorization
     ↓
Input Validation
     ↓
Application Service
     ↓
Business Logic
     ↓
Database
     ↓
Response
```

Route handlers should remain thin.

Bad:

```text
API route
 ├── validation
 ├── payment logic
 ├── order logic
 ├── email logic
 ├── database queries
 └── business rules
```

Preferred:

```text
API route
    ↓
Validate
    ↓
Call service
    ↓
Return response

Service
    ↓
Business logic
    ↓
Repository/database
```

---

# 8. Authentication

Authentication should be separated from authorization.

Authentication answers:

> Who is this user?

Authorization answers:

> What is this user allowed to do?

Roles should initially include:

```text
CUSTOMER
STAFF
ADMIN
SUPER_ADMIN
```

---

# 9. Authorization

Every protected resource must verify:

1. User is authenticated.
2. User has permission.
3. Resource belongs to the appropriate tenant.
4. Resource is accessible to that user.

Never rely solely on hiding UI elements.

For example:

```text
/admin/orders
```

must be protected server-side even if the frontend hides the admin navigation.

---

# 10. Multi-Tenant Data Model

Tenant-owned entities should include a tenant identifier.

Example:

```text
Tenant
   │
   ├── Product
   ├── Customer
   ├── Lead
   ├── Order
   ├── Conversation
   └── Automation
```

Queries must always enforce tenant scope.

Conceptually:

```text
getProduct(productId, tenantId)
```

rather than:

```text
getProduct(productId)
```

This reduces the risk of cross-tenant data exposure.

---

# 11. Commerce Architecture

Commerce flow:

```text
Product
   ↓
Cart
   ↓
Checkout
   ↓
Payment
   ↓
Payment verification
   ↓
Order
   ↓
Fulfillment
```

The client cannot determine the final order amount.

At checkout the server must retrieve current product prices and calculate the order total.

---

# 12. Payment Architecture

Payment flow:

```text
Customer
   ↓
Checkout
   ↓
Server creates payment transaction
   ↓
Payment provider
   ↓
Webhook
   ↓
Verify transaction
   ↓
Update payment
   ↓
Update order
   ↓
Trigger automation
```

The browser redirect must never be considered sufficient proof of payment.

---

# 13. AI Architecture

The AI system must be isolated behind an application service.

```text
Customer
   ↓
AI API
   ↓
Conversation Service
   ↓
AI Orchestrator
   ↓
Context Builder
   ↓
LLM
   ↓
Tool Calls
   ↓
Application Services
   ↓
Response
```

The AI must not directly access the database.

---

# 14. AI Tool Architecture

The AI may have access to controlled tools such as:

```text
searchProducts
getProductDetails
getCustomerProfile
getOrderStatus
createLead
createRecommendation
createCart
```

Tools must:

- Validate arguments
- Check authorization
- Enforce tenant boundaries
- Apply business rules
- Return structured results

The LLM should never receive unrestricted database access.

---

# 15. Product Recommendation Architecture

Recommendations should be deterministic where possible.

```text
Customer Preferences
        ↓
Recommendation Engine
        ↓
Candidate Products
        ↓
Ranking
        ↓
AI Explanation
```

The recommendation engine should consider:

- Skin type
- Skin concern
- Product compatibility
- Product availability
- Price
- Customer preferences

AI should explain results rather than replace the recommendation engine.

---

# 16. AI Knowledge

Approved product information should be maintained in structured database fields.

Examples:

```text
ingredients
skinTypes
concerns
usageInstructions
warnings
productDescription
```

If retrieval-augmented generation is introduced later, the retrieval layer must use approved business content.

The AI must not treat arbitrary customer-generated content as authoritative product information.

---

# 17. Automation Architecture

Automation should be event-driven.

Example:

```text
EVENT
 ↓
Automation Engine
 ↓
Rule Evaluation
 ↓
Create Job
 ↓
Queue
 ↓
Worker
 ↓
Action
 ↓
Log Result
```

Events may include:

```text
LEAD_CREATED
CART_ABANDONED
PAYMENT_SUCCESSFUL
ORDER_CREATED
ORDER_DELIVERED
CUSTOMER_INACTIVE
```

---

# 18. Background Jobs

Long-running and delayed operations should not block HTTP requests.

Examples:

```text
Send email
Send WhatsApp message
Abandoned-cart reminder
Post-purchase reminder
Reorder reminder
Analytics aggregation
```

Use Redis and BullMQ for background jobs.

---

# 19. Job Reliability

Every job should have:

- Unique job identifier
- Retry policy
- Maximum attempts
- Failure state
- Error information
- Timestamp
- Idempotency strategy

A job that sends a message must be designed so retries do not unintentionally send the same message repeatedly.

---

# 20. Notification Architecture

Use a notification service rather than sending messages directly from business logic.

Example:

```text
Order Service
     ↓
Notification Service
     ↓
Email Provider
```

Later:

```text
Notification Service
     ├── Email
     ├── WhatsApp
     └── SMS
```

This allows communication providers to be changed without rewriting order logic.

---

# 21. Analytics Architecture

Business events should be recorded in a structured way.

Examples:

```text
PRODUCT_VIEWED
PRODUCT_ADDED_TO_CART
CHECKOUT_STARTED
ORDER_COMPLETED
AI_CONVERSATION_STARTED
AI_RECOMMENDATION_CREATED
LEAD_CREATED
LEAD_CONVERTED
```

Analytics should not be tightly coupled to core business transactions.

Critical transactions must succeed even if analytics processing temporarily fails.

---

# 22. Error Handling

Errors should be categorized.

```text
ValidationError
AuthenticationError
AuthorizationError
NotFoundError
ConflictError
PaymentError
ExternalServiceError
InternalServerError
```

API responses should not expose internal stack traces or secrets.

Production logs should contain enough context to debug problems without exposing sensitive customer information.

---

# 23. Observability

The production application should provide:

- Structured logging
- Error tracking
- Request IDs
- Job IDs
- Payment IDs
- Automation IDs
- Audit logs

Important operations should be traceable.

Example:

```text
Order ID
   ↓
Payment ID
   ↓
Automation ID
   ↓
Notification ID
```

---

# 24. External Services

External integrations should be isolated behind service adapters.

Example:

```text
src/lib/integrations/

paystack/
email/
whatsapp/
storage/
ai/
```

Application code should not be tightly coupled to a specific provider.

---

# 25. File Storage

Product images and other uploaded assets should not be stored directly in PostgreSQL.

Use object storage.

The database should store metadata such as:

```text
fileKey
url
mimeType
size
```

Uploaded files must be validated.

---

# 26. Caching

Use caching selectively.

Good candidates:

- Product catalog queries
- Public product information
- Non-sensitive configuration

Do not cache sensitive customer data without a clear invalidation strategy.

The database remains authoritative.

---

# 27. Security Boundaries

Security boundaries must exist at:

```text
Browser
   ↓
API
   ↓
Application Service
   ↓
Database
```

Never assume that because the frontend is protected, the backend is protected.

---

# 28. Performance

The system should:

- Use pagination for large datasets
- Avoid unnecessary database queries
- Avoid N+1 queries
- Optimize images
- Cache suitable public data
- Move slow tasks to background workers
- Use database indexes for frequently queried fields

---

# 29. Testing Architecture

Testing should exist at multiple levels.

### Unit tests

Business logic.

### Integration tests

Database and service interactions.

### End-to-end tests

Critical user journeys.

Important E2E flows:

```text
Browse product
Add to cart
Checkout
Payment
Order creation

AI conversation
Product recommendation

Lead creation
Automation execution
Admin authorization
```

---

# 30. Deployment Architecture

Initial production architecture:

```text
                    CDN / DNS
                       │
                       ▼
                  Next.js App
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      PostgreSQL      Redis      Object Storage
                       │
                       ▼
                  Job Workers
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Email        WhatsApp     Analytics
```

Production environments should be separated:

```text
development
staging
production
```

---

# 31. Environment Configuration

Never commit production secrets.

Required configuration should be represented in `.env.example`.

Secrets must be provided through the deployment environment or secure secret-management system.

---

# 32. Architecture Rules for Cursor

Cursor must follow these rules:

1. Do not introduce new frameworks without justification.
2. Do not move business logic into UI components.
3. Do not access the database directly from presentation components.
4. Do not allow AI to directly mutate database records.
5. Do not bypass service-layer validation.
6. Do not expose secrets to the client.
7. Do not trust client-side prices.
8. Do not trust client-side payment status.
9. Do not bypass tenant authorization.
10. Add tests for critical business logic.
11. Preserve existing architecture when implementing new features.
12. Ask for clarification when a requirement conflicts with the architecture.
13. Prefer simple solutions over unnecessary abstractions.
14. Do not modify unrelated functionality while implementing a feature.
15. Before major architectural changes, explain the trade-offs.
