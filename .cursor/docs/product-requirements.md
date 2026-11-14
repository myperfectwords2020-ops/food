# AI Skincare Commerce & Automation Platform

## 1. Product Overview

This project is a production-ready e-commerce and AI automation platform for a skincare brand.

The platform will combine:

- A modern skincare storefront
- Product catalog and inventory
- Customer accounts
- Shopping cart and checkout
- Online payments
- AI-powered skincare product assistance
- Lead capture
- Customer management
- WhatsApp/email communication
- Automated customer follow-ups
- Abandoned-cart recovery
- Post-purchase automation
- Reorder and re-engagement campaigns
- Business administration dashboard
- Analytics

The platform should be designed as a multi-tenant-ready system so that the underlying technology can eventually support multiple businesses without requiring a complete rewrite.

---

# 2. Primary Business Objectives

The system should help the skincare business:

1. Sell products online.
2. Convert website visitors into customers.
3. Capture and manage leads.
4. Help customers discover appropriate products.
5. Reduce manual customer-support work.
6. Recover abandoned carts.
7. Increase repeat purchases.
8. Automate post-purchase communication.
9. Track customer activity and conversion.
10. Give the business owner a centralized operational dashboard.

The system should prioritize **revenue and conversion**, not vanity engagement metrics.

---

# 3. Target Users

## 3.1 Website Visitor

A visitor who has not created an account.

They can:

- Browse products
- Search products
- View product details
- Use the AI assistant
- Submit an enquiry
- Add products to cart
- Begin checkout
- Purchase products
- Subscribe to marketing communication where appropriate

---

## 3.2 Customer

A visitor who has purchased or created an account.

They can:

- Manage their profile
- View orders
- Track orders
- View previous purchases
- Manage addresses
- Save products
- View recommendations
- Use the AI assistant
- Contact support

---

## 3.3 Business Administrator

The business owner or authorized staff member.

They can:

- Manage products
- Manage categories
- Manage inventory
- Manage customers
- Manage leads
- Manage orders
- View AI conversations
- Configure automations
- View analytics
- Manage business settings

---

## 3.4 System Administrator

A platform-level administrator.

They can:

- Manage tenants
- Manage organizations
- Manage platform configuration
- Manage system users
- Access system-level audit logs
- Monitor platform health

---

# 4. Customer Website

## 4.1 Homepage

The homepage should communicate:

- Brand positioning
- Core skincare products
- Main customer benefits
- Featured products
- Customer trust signals
- Social proof
- AI skincare assistant
- Clear calls to action

Primary calls to action should encourage:

- Shop products
- Find your routine
- Talk to the AI assistant
- Contact the business

---

# 5. Product Catalog

The platform must support:

- Product categories
- Product collections
- Product images
- Product descriptions
- Pricing
- Discount pricing
- Inventory
- Ingredients
- Skin types
- Skin concerns
- Usage instructions
- Product warnings
- Product status

Products can be:

- Active
- Draft
- Archived
- Out of stock

---

# 6. Product Search

Customers should be able to search products by:

- Product name
- Category
- Skin type
- Skin concern
- Ingredient
- Price range

Search should be implemented server-side where appropriate.

Search input must be validated and protected against abuse.

---

# 7. AI Skincare Assistant

The platform will provide an AI assistant that helps customers discover products.

The assistant may ask questions such as:

- What is your skin type?
- What skincare concern are you trying to address?
- What products are you currently using?
- What is your preferred budget?
- Are there ingredients you avoid?

The AI should use approved product information from the platform.

The AI should NOT invent products, prices, ingredients, availability, or business policies.

---

# 8. AI Product Recommendations

Recommendations should use a combination of:

1. Structured business rules
2. Product metadata
3. Customer preferences
4. AI-generated explanations

The AI should not independently determine product eligibility without consulting the application's product recommendation logic.

Example:

```text
Customer
    ↓
Skin type
    ↓
Skin concern
    ↓
Preferences
    ↓
Recommendation engine
    ↓
Matching products
    ↓
AI explanation
```

---

# 9. AI Safety

The assistant is a skincare product discovery and shopping assistant.

It must not claim to diagnose medical conditions.

It must not present itself as a dermatologist or medical professional.

When a customer describes symptoms that may require professional medical attention, the system should recommend consulting an appropriately qualified healthcare professional.

The AI should not make unsupported medical claims about products.

---

# 10. Customer Lead Capture

The system should capture leads from:

- Website forms
- AI conversations
- Product enquiries
- Contact forms
- Social campaigns
- WhatsApp
- Other configured integrations

Each lead should contain information such as:

- Name
- Email
- Phone number
- Source
- Interested product
- Customer concern
- Status
- Notes
- Created date
- Last activity

---

# 11. Lead Lifecycle

The initial lifecycle should be:

```text
NEW
 ↓
CONTACTED
 ↓
QUALIFIED
 ↓
CONVERTED
```

Alternative statuses may include:

```text
UNQUALIFIED
LOST
REACTIVATION
```

The system must maintain a history of important lead status changes.

---

# 12. Customer Lifecycle

Customers should be categorized based on activity:

```text
NEW_CUSTOMER
ACTIVE_CUSTOMER
REPEAT_CUSTOMER
INACTIVE_CUSTOMER
```

The lifecycle can later be expanded.

Lifecycle changes should be determined by actual customer activity rather than arbitrary AI decisions.

---

# 13. Shopping Cart

Customers can:

- Add products
- Remove products
- Change quantities
- View subtotal
- Apply supported discounts
- Proceed to checkout

The server must validate:

- Product availability
- Current price
- Quantity
- Inventory
- Discount validity

The client must never be treated as the source of truth for order pricing.

---

# 14. Checkout

Checkout should collect:

- Customer information
- Delivery address
- Contact information
- Order details
- Payment information through the payment provider

The system should create an order only after appropriate payment confirmation.

---

# 15. Payment

The first payment provider should be Paystack.

The system must:

- Initialize transactions server-side
- Verify payments server-side
- Verify webhook authenticity
- Never trust payment status supplied directly by the browser
- Maintain payment records
- Maintain order/payment relationships

Payment states may include:

```text
PENDING
SUCCESSFUL
FAILED
CANCELLED
REFUNDED
```

---

# 16. Orders

Orders should contain:

- Customer
- Items
- Quantities
- Unit prices
- Discounts
- Total
- Payment status
- Fulfillment status
- Delivery information
- Timestamps

Order status may include:

```text
PENDING
PAID
PROCESSING
SHIPPED
DELIVERED
CANCELLED
REFUNDED
```

---

# 17. Customer Account

Customers should have access to:

- Profile
- Orders
- Addresses
- Saved products
- Recommendations
- AI conversations
- Communication preferences

Sensitive information must not be exposed through unauthorized API requests.

---

# 18. Admin Dashboard

The admin dashboard should include:

## Overview

- Revenue
- Orders
- Customers
- Leads
- Conversion rate
- Average order value
- Repeat customer rate
- Top products

## Product management

- Create product
- Edit product
- Archive product
- Update inventory
- Manage pricing

## Customer management

- Search customers
- View customer profile
- View customer activity
- View orders
- View conversations

## Lead management

- View leads
- Filter leads
- Update lead status
- Add notes
- View source
- View activity

## Automation management

- View automations
- Enable/disable automations
- View automation executions
- View failed executions

---

# 19. Automations

The system should support event-driven automation.

Initial automations:

### New Lead

```text
Lead created
    ↓
Store lead
    ↓
Send acknowledgement
    ↓
Notify business
```

### Abandoned Cart

```text
Cart created
    ↓
No completed order
    ↓
Schedule reminder
    ↓
Send reminder
```

### Order Confirmation

```text
Payment confirmed
    ↓
Order marked PAID
    ↓
Send confirmation
```

### Post-Purchase

```text
Order delivered
    ↓
Wait configured period
    ↓
Send follow-up
```

### Reorder

```text
Customer purchased product
    ↓
Expected usage period
    ↓
Check whether customer reordered
    ↓
Send reorder reminder
```

### Customer Reactivation

```text
Customer becomes inactive
    ↓
Wait configured period
    ↓
Send re-engagement message
```

---

# 20. Communication Channels

The platform should be designed to support:

- Email
- WhatsApp
- Website notifications

The initial implementation may launch with email first and add WhatsApp after the core automation system is stable.

All outbound communication should be logged.

---

# 21. Automation Requirements

Automations must be:

- Retryable
- Idempotent
- Observable
- Auditable
- Disableable
- Configurable

A failed automation must not silently disappear.

The system should record:

- Automation ID
- Event
- Customer
- Execution status
- Attempt count
- Error
- Timestamp

---

# 22. Analytics

The system should track business metrics such as:

- Website visitors
- Product views
- Add-to-cart rate
- Checkout initiation
- Completed orders
- Conversion rate
- Revenue
- Average order value
- Abandoned carts
- Lead conversion
- Repeat purchases
- AI assistant usage
- AI-assisted conversions

Analytics should focus on business outcomes.

---

# 23. Multi-Tenant Architecture

The database and application should be designed so business data can be isolated by tenant.

Core tenant relationship:

```text
Tenant
 ├── Users
 ├── Products
 ├── Customers
 ├── Leads
 ├── Orders
 ├── Conversations
 └── Automations
```

Every tenant-owned resource must have a clear tenant relationship.

Tenant isolation is a security requirement.

---

# 24. Non-Functional Requirements

The production system must prioritize:

- Security
- Reliability
- Performance
- Maintainability
- Observability
- Scalability
- Data integrity
- Accessibility
- Mobile responsiveness

---

# 25. Development Principles

The implementation must follow these principles:

1. Server is the source of truth.
2. Validate all external input.
3. Never trust client-side values.
4. Never expose secrets to the browser.
5. AI output is untrusted.
6. AI cannot directly mutate critical business data.
7. Business rules belong in application logic.
8. Database operations must be authorized.
9. Critical workflows must have automated tests.
10. Production changes must be observable and auditable.

# AI Skincare Commerce & Automation Platform

## 1. Product Overview

This project is a production-ready e-commerce and AI automation platform for a skincare brand.

The platform will combine:

- A modern skincare storefront
- Product catalog and inventory
- Customer accounts
- Shopping cart and checkout
- Online payments
- AI-powered skincare product assistance
- Lead capture
- Customer management
- WhatsApp/email communication
- Automated customer follow-ups
- Abandoned-cart recovery
- Post-purchase automation
- Reorder and re-engagement campaigns
- Business administration dashboard
- Analytics

The platform should be designed as a multi-tenant-ready system so that the underlying technology can eventually support multiple businesses without requiring a complete rewrite.

---

# 2. Primary Business Objectives

The system should help the skincare business:

1. Sell products online.
2. Convert website visitors into customers.
3. Capture and manage leads.
4. Help customers discover appropriate products.
5. Reduce manual customer-support work.
6. Recover abandoned carts.
7. Increase repeat purchases.
8. Automate post-purchase communication.
9. Track customer activity and conversion.
10. Give the business owner a centralized operational dashboard.

The system should prioritize **revenue and conversion**, not vanity engagement metrics.

---

# 3. Target Users

## 3.1 Website Visitor

A visitor who has not created an account.

They can:

- Browse products
- Search products
- View product details
- Use the AI assistant
- Submit an enquiry
- Add products to cart
- Begin checkout
- Purchase products
- Subscribe to marketing communication where appropriate

---

## 3.2 Customer

A visitor who has purchased or created an account.

They can:

- Manage their profile
- View orders
- Track orders
- View previous purchases
- Manage addresses
- Save products
- View recommendations
- Use the AI assistant
- Contact support

---

## 3.3 Business Administrator

The business owner or authorized staff member.

They can:

- Manage products
- Manage categories
- Manage inventory
- Manage customers
- Manage leads
- Manage orders
- View AI conversations
- Configure automations
- View analytics
- Manage business settings

---

## 3.4 System Administrator

A platform-level administrator.

They can:

- Manage tenants
- Manage organizations
- Manage platform configuration
- Manage system users
- Access system-level audit logs
- Monitor platform health

---

# 4. Customer Website

## 4.1 Homepage

The homepage should communicate:

- Brand positioning
- Core skincare products
- Main customer benefits
- Featured products
- Customer trust signals
- Social proof
- AI skincare assistant
- Clear calls to action

Primary calls to action should encourage:

- Shop products
- Find your routine
- Talk to the AI assistant
- Contact the business

---

# 5. Product Catalog

The platform must support:

- Product categories
- Product collections
- Product images
- Product descriptions
- Pricing
- Discount pricing
- Inventory
- Ingredients
- Skin types
- Skin concerns
- Usage instructions
- Product warnings
- Product status

Products can be:

- Active
- Draft
- Archived
- Out of stock

---

# 6. Product Search

Customers should be able to search products by:

- Product name
- Category
- Skin type
- Skin concern
- Ingredient
- Price range

Search should be implemented server-side where appropriate.

Search input must be validated and protected against abuse.

---

# 7. AI Skincare Assistant

The platform will provide an AI assistant that helps customers discover products.

The assistant may ask questions such as:

- What is your skin type?
- What skincare concern are you trying to address?
- What products are you currently using?
- What is your preferred budget?
- Are there ingredients you avoid?

The AI should use approved product information from the platform.

The AI should NOT invent products, prices, ingredients, availability, or business policies.

---

# 8. AI Product Recommendations

Recommendations should use a combination of:

1. Structured business rules
2. Product metadata
3. Customer preferences
4. AI-generated explanations

The AI should not independently determine product eligibility without consulting the application's product recommendation logic.

Example:

```text
Customer
    ↓
Skin type
    ↓
Skin concern
    ↓
Preferences
    ↓
Recommendation engine
    ↓
Matching products
    ↓
AI explanation
```

---

# 9. AI Safety

The assistant is a skincare product discovery and shopping assistant.

It must not claim to diagnose medical conditions.

It must not present itself as a dermatologist or medical professional.

When a customer describes symptoms that may require professional medical attention, the system should recommend consulting an appropriately qualified healthcare professional.

The AI should not make unsupported medical claims about products.

---

# 10. Customer Lead Capture

The system should capture leads from:

- Website forms
- AI conversations
- Product enquiries
- Contact forms
- Social campaigns
- WhatsApp
- Other configured integrations

Each lead should contain information such as:

- Name
- Email
- Phone number
- Source
- Interested product
- Customer concern
- Status
- Notes
- Created date
- Last activity

---

# 11. Lead Lifecycle

The initial lifecycle should be:

```text
NEW
 ↓
CONTACTED
 ↓
QUALIFIED
 ↓
CONVERTED
```

Alternative statuses may include:

```text
UNQUALIFIED
LOST
REACTIVATION
```

The system must maintain a history of important lead status changes.

---

# 12. Customer Lifecycle

Customers should be categorized based on activity:

```text
NEW_CUSTOMER
ACTIVE_CUSTOMER
REPEAT_CUSTOMER
INACTIVE_CUSTOMER
```

The lifecycle can later be expanded.

Lifecycle changes should be determined by actual customer activity rather than arbitrary AI decisions.

---

# 13. Shopping Cart

Customers can:

- Add products
- Remove products
- Change quantities
- View subtotal
- Apply supported discounts
- Proceed to checkout

The server must validate:

- Product availability
- Current price
- Quantity
- Inventory
- Discount validity

The client must never be treated as the source of truth for order pricing.

---

# 14. Checkout

Checkout should collect:

- Customer information
- Delivery address
- Contact information
- Order details
- Payment information through the payment provider

The system should create an order only after appropriate payment confirmation.

---

# 15. Payment

The first payment provider should be Paystack.

The system must:

- Initialize transactions server-side
- Verify payments server-side
- Verify webhook authenticity
- Never trust payment status supplied directly by the browser
- Maintain payment records
- Maintain order/payment relationships

Payment states may include:

```text
PENDING
SUCCESSFUL
FAILED
CANCELLED
REFUNDED
```

---

# 16. Orders

Orders should contain:

- Customer
- Items
- Quantities
- Unit prices
- Discounts
- Total
- Payment status
- Fulfillment status
- Delivery information
- Timestamps

Order status may include:

```text
PENDING
PAID
PROCESSING
SHIPPED
DELIVERED
CANCELLED
REFUNDED
```

---

# 17. Customer Account

Customers should have access to:

- Profile
- Orders
- Addresses
- Saved products
- Recommendations
- AI conversations
- Communication preferences

Sensitive information must not be exposed through unauthorized API requests.

---

# 18. Admin Dashboard

The admin dashboard should include:

## Overview

- Revenue
- Orders
- Customers
- Leads
- Conversion rate
- Average order value
- Repeat customer rate
- Top products

## Product management

- Create product
- Edit product
- Archive product
- Update inventory
- Manage pricing

## Customer management

- Search customers
- View customer profile
- View customer activity
- View orders
- View conversations

## Lead management

- View leads
- Filter leads
- Update lead status
- Add notes
- View source
- View activity

## Automation management

- View automations
- Enable/disable automations
- View automation executions
- View failed executions

---

# 19. Automations

The system should support event-driven automation.

Initial automations:

### New Lead

```text
Lead created
    ↓
Store lead
    ↓
Send acknowledgement
    ↓
Notify business
```

### Abandoned Cart

```text
Cart created
    ↓
No completed order
    ↓
Schedule reminder
    ↓
Send reminder
```

### Order Confirmation

```text
Payment confirmed
    ↓
Order marked PAID
    ↓
Send confirmation
```

### Post-Purchase

```text
Order delivered
    ↓
Wait configured period
    ↓
Send follow-up
```

### Reorder

```text
Customer purchased product
    ↓
Expected usage period
    ↓
Check whether customer reordered
    ↓
Send reorder reminder
```

### Customer Reactivation

```text
Customer becomes inactive
    ↓
Wait configured period
    ↓
Send re-engagement message
```

---

# 20. Communication Channels

The platform should be designed to support:

- Email
- WhatsApp
- Website notifications

The initial implementation may launch with email first and add WhatsApp after the core automation system is stable.

All outbound communication should be logged.

---

# 21. Automation Requirements

Automations must be:

- Retryable
- Idempotent
- Observable
- Auditable
- Disableable
- Configurable

A failed automation must not silently disappear.

The system should record:

- Automation ID
- Event
- Customer
- Execution status
- Attempt count
- Error
- Timestamp

---

# 22. Analytics

The system should track business metrics such as:

- Website visitors
- Product views
- Add-to-cart rate
- Checkout initiation
- Completed orders
- Conversion rate
- Revenue
- Average order value
- Abandoned carts
- Lead conversion
- Repeat purchases
- AI assistant usage
- AI-assisted conversions

Analytics should focus on business outcomes.

---

# 23. Multi-Tenant Architecture

The database and application should be designed so business data can be isolated by tenant.

Core tenant relationship:

```text
Tenant
 ├── Users
 ├── Products
 ├── Customers
 ├── Leads
 ├── Orders
 ├── Conversations
 └── Automations
```

Every tenant-owned resource must have a clear tenant relationship.

Tenant isolation is a security requirement.

---

# 24. Non-Functional Requirements

The production system must prioritize:

- Security
- Reliability
- Performance
- Maintainability
- Observability
- Scalability
- Data integrity
- Accessibility
- Mobile responsiveness

---

# 25. Development Principles

The implementation must follow these principles:

1. Server is the source of truth.
2. Validate all external input.
3. Never trust client-side values.
4. Never expose secrets to the browser.
5. AI output is untrusted.
6. AI cannot directly mutate critical business data.
7. Business rules belong in application logic.
8. Database operations must be authorized.
9. Critical workflows must have automated tests.
10. Production changes must be observable and auditable.
