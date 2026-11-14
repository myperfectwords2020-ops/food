# Business Rules

## 1. Purpose

This document defines the business rules that govern the skincare commerce and automation platform.

Business rules are authoritative application rules.

They must not be delegated entirely to AI or implemented only in frontend code.

---

# 2. Product Rules

A product must have:

- Name
- Description
- Price
- At least one image
- Product status
- Inventory status

Optional product information:

- Ingredients
- Skin types
- Skin concerns
- Usage instructions
- Warnings
- Product category
- Benefits

A product cannot be purchased when it is unavailable.

---

# 3. Product Status

Products can have the following statuses:

```text
DRAFT
ACTIVE
ARCHIVED
```

Only `ACTIVE` products should appear in the public storefront.

Archived products should not be available for new purchases.

Historical orders must retain the product information that existed when the order was placed.

---

# 4. Inventory

The server is the source of truth for inventory.

The browser must never determine whether a product is available.

Before creating an order, the server must verify:

```text
Product exists
Product is active
Product is purchasable
Quantity is valid
Inventory is sufficient
```

Inventory changes must be transactional.

---

# 5. Pricing

Product price is determined by the server.

The client may display a price, but the server must retrieve the current price before creating an order.

The server must calculate:

```text
Subtotal
Discount
Delivery fee
Tax if applicable
Final total
```

The client-provided total must never be trusted.

---

# 6. Cart Rules

A cart may contain only products belonging to the current tenant.

Cart quantities must be positive integers.

The server must revalidate product availability and pricing before checkout.

A cart does not guarantee inventory reservation unless inventory reservation is explicitly implemented.

---

# 7. Order Rules

An order must contain:

- Customer
- Tenant
- At least one item
- Product snapshot
- Quantity
- Unit price
- Total amount
- Payment state
- Fulfillment state

Order items should preserve historical product information.

For example:

```text
Product name at purchase
Product price at purchase
```

must remain available even if the product is later renamed or repriced.

---

# 8. Payment Rules

Orders should not be marked as paid based solely on:

- Browser redirects
- Client-side state
- Query parameters
- Customer claims

Payment confirmation must come from server-side verification.

The system should support:

```text
PENDING
SUCCESSFUL
FAILED
REFUNDED
```

Payment processing must be idempotent.

A duplicate webhook must not create a duplicate order or duplicate payment.

---

# 9. Customer Rules

A customer may:

- Create an account
- Browse products
- Purchase products
- View their own orders
- Manage their own profile

A customer must never access:

- Another customer's orders
- Another customer's conversations
- Administrative information
- Internal business notes
- Other tenant data

---

# 10. Lead Rules

A lead can originate from:

- Website
- AI assistant
- Contact form
- Social media
- WhatsApp
- Campaign
- Manual entry

Every lead should have a source.

Lead status:

```text
NEW
CONTACTED
QUALIFIED
CONVERTED
LOST
UNQUALIFIED
```

A lead becomes `CONVERTED` when a defined conversion event occurs, normally a successful purchase or an explicitly recorded sales conversion.

---

# 11. Lead Deduplication

The system should attempt to identify duplicate leads.

Potential matching identifiers:

- Email
- Phone number

Duplicate detection must not accidentally merge two different people.

The system should preserve the original lead source and activity history.

---

# 12. Customer Lifecycle

Initial lifecycle:

```text
NEW_CUSTOMER
ACTIVE_CUSTOMER
REPEAT_CUSTOMER
INACTIVE_CUSTOMER
```

Rules should be configurable rather than hard-coded wherever practical.

Example:

```text
NEW_CUSTOMER
= first successful purchase

REPEAT_CUSTOMER
= customer has completed more than one purchase

INACTIVE_CUSTOMER
= no qualifying activity for configured period
```

---

# 13. AI Recommendation Rules

The AI may recommend only products that:

1. Exist.
2. Belong to the current tenant.
3. Are active.
4. Are eligible according to recommendation rules.

The AI must not invent products.

The AI must not invent:

- Prices
- Ingredients
- Stock status
- Discounts
- Shipping policies
- Medical claims

---

# 14. AI Safety Rules

The assistant is not a medical diagnostic system.

It must not claim:

- "You have eczema."
- "You have acne."
- "This product will cure your condition."

Instead, it should use language such as:

- "This product may be suitable for..."
- "Based on the information you've provided..."
- "For persistent or severe symptoms, consider speaking with a qualified healthcare professional."

---

# 15. AI Purchase Rules

The AI may assist with:

- Product discovery
- Product comparison
- Product education
- Cart creation
- Order lookup
- Basic customer support

The AI must not independently:

- Issue refunds
- Change payment status
- Change product prices
- Modify inventory
- Delete customers
- Delete orders
- Grant administrative privileges

Sensitive actions require explicit application-level authorization.

---

# 16. Discount Rules

Discounts must be validated server-side.

The system should verify:

```text
Discount exists
Discount is active
Discount has not expired
Customer is eligible
Product is eligible
Usage limit has not been exceeded
```

---

# 17. Automation Rules

Automations must be event-driven.

An automation should define:

```text
Trigger
Conditions
Actions
Delay
Retry policy
Enabled state
```

Example:

```text
Trigger:
CART_ABANDONED

Condition:
Order does not exist

Delay:
24 hours

Action:
Send reminder
```

---

# 18. Automation Stop Conditions

Automations should stop when their objective has already been achieved.

Example:

```text
Abandoned cart
      ↓
Customer purchases
      ↓
Cancel remaining cart reminders
```

The system should avoid sending irrelevant messages after conversion.

---

# 19. Communication Rules

Customers should receive only relevant communications.

Marketing communications must respect communication preferences and applicable consent requirements.

Transactional communications should be separated from marketing communications.

---

# 20. Message Frequency

The system should support communication frequency limits.

Example:

```text
Maximum marketing messages per customer
Maximum automation messages per day
Maximum AI outreach attempts
```

Limits should be configurable.

---

# 21. Audit Rules

Critical operations should be auditable.

Examples:

- Product price changes
- Inventory changes
- Order status changes
- Refunds
- Admin actions
- Automation changes
- Customer data changes

Audit logs should contain:

```text
Actor
Action
Resource
Resource ID
Timestamp
Relevant metadata
```

---

# 22. Tenant Isolation

Every tenant-owned operation must enforce tenant scope.

A user belonging to Tenant A must never access Tenant B's:

- Products
- Customers
- Orders
- Leads
- Conversations
- Automations
- Analytics

Tenant isolation is a critical security requirement.

---

# 23. Data Deletion

Deletion of important business records should be carefully controlled.

Orders and financial records should generally not be hard-deleted simply because a customer requests account deletion.

Where appropriate, personal information may be anonymized while preserving required business records.

---

# 24. Source of Truth

The authoritative source for each type of data is:

```text
Product information       → PostgreSQL
Price                     → PostgreSQL
Inventory                 → PostgreSQL
Order                     → PostgreSQL
Payment status            → Verified payment provider + PostgreSQL
Customer profile          → PostgreSQL
Automation state          → PostgreSQL
Job execution             → Queue + PostgreSQL
AI conversation           → PostgreSQL
AI generated response     → AI provider + stored conversation
```

AI output is never the source of truth for business-critical data.
