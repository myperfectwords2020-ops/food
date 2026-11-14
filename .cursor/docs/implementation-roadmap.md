# Implementation Roadmap

## Phase 0 — Project Setup

### Tasks

- Create Git repository
- Create Next.js project
- Configure TypeScript
- Configure Tailwind
- Configure shadcn/ui
- Configure ESLint
- Configure Prettier
- Configure environment variables
- Configure PostgreSQL
- Configure Prisma
- Create project documentation
- Configure Cursor rules

### Completion Criteria

The project runs locally and has a clean development environment.

---

# Phase 1 — Authentication & Tenants

### Tasks

- Authentication
- User model
- Tenant model
- Roles
- Session handling
- Authorization middleware
- Tenant isolation helpers

### Tests

- Login
- Protected route
- Unauthorized request
- Tenant isolation

---

# Phase 2 — Product Catalog

### Tasks

- Product schema
- Categories
- Product images
- Ingredients
- Skin types
- Skin concerns
- Product CRUD
- Product search
- Product pages
- Admin product management

### Tests

- Product creation
- Product update
- Product archive
- Product search
- Tenant isolation

---

# Phase 3 — Cart & Checkout

### Tasks

- Cart
- Cart items
- Quantity updates
- Price validation
- Inventory validation
- Checkout
- Address management

### Tests

- Add to cart
- Remove from cart
- Quantity validation
- Price tampering
- Inventory validation

---

# Phase 4 — Payments & Orders

### Tasks

- Paystack integration
- Payment initialization
- Payment verification
- Webhooks
- Order creation
- Order status
- Payment status
- Order history

### Critical Tests

- Successful payment
- Failed payment
- Duplicate webhook
- Invalid webhook
- Client-side price manipulation
- Order creation idempotency

---

# Phase 5 — Customer Management

### Tasks

- Customer profiles
- Customer dashboard
- Customer activity
- Customer lifecycle
- Saved products
- Communication preferences

---

# Phase 6 — AI Assistant

### Tasks

- AI service abstraction
- Conversation model
- Conversation UI
- AI orchestrator
- Product search tool
- Product details tool
- Recommendation engine
- AI safety rules
- Rate limiting
- Usage tracking

### Tests

- Product recommendation
- Invalid tool arguments
- Unauthorized tool access
- Prompt injection attempts
- AI provider failure

---

# Phase 7 — Lead Management

### Tasks

- Lead model
- Lead creation
- Lead sources
- Lead status
- Lead deduplication
- Lead dashboard
- Customer conversion tracking

---

# Phase 8 — Automation Engine

### Tasks

- Event system
- Automation model
- Automation execution model
- Redis
- BullMQ
- Workers
- Retry logic
- Idempotency
- Email notifications

Initial automations:

```text
New lead
Abandoned cart
Order confirmation
Post-purchase
Reorder
Customer reactivation
```

---

# Phase 9 — WhatsApp

### Tasks

- WhatsApp provider integration
- Message service
- Message templates
- Delivery status
- Communication preferences
- Rate limiting
- Automation integration

---

# Phase 10 — Admin Dashboard

### Tasks

- Dashboard
- Orders
- Products
- Customers
- Leads
- AI conversations
- Automations
- Analytics
- Audit logs

---

# Phase 11 — Analytics

### Tasks

Track:

```text
Product views
Add to cart
Checkout
Purchase
Revenue
AI interactions
Recommendations
Leads
Lead conversion
Repeat purchases
Abandoned carts
```

---

# Phase 12 — Production Hardening

### Tasks

- Security audit
- Dependency audit
- Rate-limit testing
- Authorization testing
- Tenant isolation testing
- Payment testing
- AI security testing
- E2E testing
- Error tracking
- Logging
- Monitoring
- Database backups
- Disaster recovery plan

---

# Phase 13 — Staging

Deploy a complete staging environment.

Test:

```text
Registration
Login
Product browsing
AI assistant
Cart
Checkout
Payment
Order
Admin
Automation
Email
WhatsApp
```

No production customer data should be used in staging.

---

# Phase 14 — Production Launch

Before launch:

- Configure production domain
- Configure HTTPS
- Configure production database
- Configure backups
- Configure Redis
- Configure payment provider
- Configure email
- Configure WhatsApp
- Configure monitoring
- Configure analytics
- Run smoke tests

---

# Phase 15 — Post-Launch

Monitor:

```text
Error rate
Payment failures
AI failures
Automation failures
Checkout conversion
Abandoned carts
Lead conversion
Customer retention
```

Fix reliability issues before adding large new features.

---

# Development Rule

Do not skip phases simply because a feature appears easy.

Implement and test each vertical slice before moving to the next phase.

Do not build the entire application in one AI coding session.
