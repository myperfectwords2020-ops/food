# Automation System

## 1. Objective

The automation system handles repetitive business operations without requiring staff to manually perform every follow-up.

The system must be reliable, observable, retryable, and idempotent.

---

# 2. Architecture

```text
Business Event
      ↓
Event Handler
      ↓
Automation Engine
      ↓
Conditions
      ↓
Scheduled Job
      ↓
Worker
      ↓
Action
      ↓
Execution Log
```

---

# 3. Supported Events

Initial events:

```text
LEAD_CREATED
CART_CREATED
CART_ABANDONED
CHECKOUT_STARTED
PAYMENT_SUCCESSFUL
ORDER_CREATED
ORDER_DELIVERED
CUSTOMER_BECAME_INACTIVE
PRODUCT_BACK_IN_STOCK
```

---

# 4. Automation Structure

Every automation should have:

```text
id
tenantId
name
trigger
conditions
actions
enabled
createdAt
updatedAt
```

---

# 5. New Lead Automation

Trigger:

```text
LEAD_CREATED
```

Flow:

```text
Lead created
     ↓
Store lead
     ↓
Notify business
     ↓
Send customer acknowledgement
```

The customer should not receive excessive automated communication.

---

# 6. Abandoned Cart Automation

Trigger:

```text
CART_ABANDONED
```

Example:

```text
Cart abandoned
      ↓
Wait 1 hour
      ↓
Check order status
      ↓
If purchased → STOP
      ↓
Send reminder
```

Optional:

```text
Wait 24 hours
      ↓
Check again
      ↓
Send second reminder
```

---

# 7. Order Confirmation

Trigger:

```text
PAYMENT_SUCCESSFUL
```

Flow:

```text
Payment verified
      ↓
Order marked PAID
      ↓
Send confirmation
      ↓
Create fulfillment workflow
```

This workflow must be idempotent.

---

# 8. Post-Purchase Automation

Trigger:

```text
ORDER_DELIVERED
```

Example:

```text
Delivered
   ↓
Wait configured period
   ↓
Send usage/support message
```

The period should be configurable per automation.

---

# 9. Reorder Automation

The reorder automation should be based on configurable product usage intervals.

Example:

```text
Product purchased
      ↓
Expected usage period
      ↓
Check whether customer repurchased
      ↓
If yes → STOP
      ↓
If no → Send reorder reminder
```

---

# 10. Customer Reactivation

Trigger:

```text
CUSTOMER_BECAME_INACTIVE
```

Flow:

```text
Customer inactive
      ↓
Check communication preferences
      ↓
Send reactivation campaign
      ↓
Track response
```

---

# 11. Automation Conditions

Conditions may include:

```text
customer.hasPurchased
customer.hasActiveCart
customer.hasConsentedToMarketing
order.status
product.stock
lead.status
customer.lastActivity
```

Conditions must be evaluated using trusted server-side data.

---

# 12. Actions

Initial actions:

```text
SEND_EMAIL
SEND_WHATSAPP
CREATE_LEAD
UPDATE_LEAD
CREATE_NOTIFICATION
SCHEDULE_JOB
```

Actions should be implemented through service adapters.

---

# 13. Job Queue

Use Redis + BullMQ.

Queue examples:

```text
notifications
automations
emails
analytics
```

Jobs must have retry policies.

---

# 14. Idempotency

Every critical automation action must support idempotency.

Example:

```text
automationId
customerId
actionType
eventId
```

The system must be able to determine whether an action has already been executed.

---

# 15. Failed Jobs

Failed jobs should:

1. Retry automatically where appropriate.
2. Use exponential backoff.
3. Record the error.
4. Eventually enter a failed/dead-letter state.
5. Become visible to administrators.

---

# 16. Automation Dashboard

Administrators should be able to see:

```text
Automation
Status
Executions
Successful
Failed
Last execution
Next execution
```

They should be able to:

- Enable
- Disable
- View execution history

Advanced workflow editing can be added later.

---

# 17. Communication Preferences

Before marketing communication:

```text
Check customer consent
Check channel availability
Check frequency limits
```

Transactional notifications should be treated separately from marketing communications.

---

# 18. Automation Safety

Automations must never:

- Change payment status
- Modify financial totals
- Delete customers
- Delete orders
- Grant permissions

without an explicit authorized workflow.

---

# 19. Observability

Each automation execution should record:

```text
automationId
tenantId
customerId
trigger
action
status
attempts
error
startedAt
completedAt
```

This makes automation failures diagnosable.

---

# 20. Future Automation Engine

The initial system should use code-defined automations.

Later, the admin dashboard can support a visual workflow builder:

```text
Trigger
   ↓
Condition
   ↓
Delay
   ↓
Action
   ↓
Condition
   ↓
Action
```

Do not build the visual workflow editor in the first MVP.
