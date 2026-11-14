# Production Security Requirements

## 1. General Principle

Security must be implemented at the server and database layers.

Frontend restrictions are not security controls.

---

# 2. Authentication

Protected resources require authentication.

Sessions must be securely managed.

Never store authentication secrets in localStorage unless explicitly required by the authentication architecture.

Use secure, HTTP-only cookies where applicable.

---

# 3. Authorization

Every protected operation must verify authorization.

Roles:

```text
CUSTOMER
STAFF
ADMIN
SUPER_ADMIN
```

Never rely only on frontend role checks.

---

# 4. Tenant Isolation

Every tenant-owned database query must enforce tenant scope.

Cross-tenant access must be treated as a critical security vulnerability.

---

# 5. Input Validation

All external input must be validated.

Use Zod or equivalent schema validation.

Validate:

- Request body
- Query parameters
- Route parameters
- File uploads
- AI tool arguments
- Webhook payloads

---

# 6. Database Security

Use Prisma or parameterized queries.

Never construct SQL queries from untrusted strings.

Database credentials must never be exposed to the browser.

---

# 7. Secrets

Never commit:

```text
API keys
Database passwords
Payment secrets
OAuth secrets
JWT secrets
Webhook secrets
```

Use environment variables or secure secret management.

---

# 8. Payment Security

Payment webhook signatures must be verified.

Payment status must be determined server-side.

Never trust:

```text
payment=success
```

from a browser URL.

---

# 9. API Security

Public endpoints should have:

- Rate limiting
- Input validation
- Appropriate authentication
- Abuse protection

AI endpoints should have stricter rate limits because they may incur external API costs.

---

# 10. Admin Security

Admin routes require:

- Authentication
- Role verification
- Tenant verification
- Server-side authorization

Sensitive administrative operations should be audited.

---

# 11. AI Security

AI output is untrusted.

Never execute AI-generated:

- SQL
- Shell commands
- Arbitrary code
- Database operations

AI tools must call controlled application services.

---

# 12. Prompt Injection

Customer messages must be treated as untrusted data.

The AI must not allow customer messages to override system security instructions.

---

# 13. XSS Protection

User-generated content must be safely escaped.

Do not render arbitrary HTML from customers or AI responses without sanitization.

---

# 14. CSRF

State-changing browser requests must be protected according to the application's authentication architecture.

---

# 15. File Upload Security

Validate:

- File type
- MIME type
- File size
- File extension

Do not execute uploaded files.

Uploaded files should be stored in isolated object storage.

---

# 16. Logging

Do not log:

- Passwords
- API keys
- Session tokens
- Payment secrets
- Full sensitive customer information

Logs should contain safe identifiers.

---

# 17. Audit Logging

Audit:

- Admin login
- Product changes
- Price changes
- Inventory changes
- Order changes
- Refund operations
- Automation configuration
- Permission changes

---

# 18. Rate Limiting

Rate limits should exist for:

```text
Login
Registration
Password reset
AI requests
Lead submission
Contact forms
Checkout
Payment initialization
Public APIs
```

---

# 19. Dependency Security

Dependencies should be:

- Regularly updated
- Audited
- Locked to known versions
- Removed when unused

Run dependency vulnerability checks during CI.

---

# 20. Security Headers

Production should configure appropriate security headers including:

- Content Security Policy where practical
- X-Content-Type-Options
- Referrer-Policy
- Frame protection
- Strict Transport Security

---

# 21. Error Responses

Production API responses must not expose:

- Stack traces
- Database errors
- Internal file paths
- Secrets
- Internal infrastructure details

---

# 22. Backups

Production PostgreSQL must have automated backups.

Backups should be tested periodically.

A backup that has never been restored is not considered verified.

---

# 23. Security Testing

Before production:

```text
Authentication tests
Authorization tests
Tenant isolation tests
Input validation tests
Webhook tests
AI security tests
Rate-limit tests
File-upload tests
Admin access tests
```

---

# 24. Security Review

Before launch, perform a dedicated security audit.

The audit should review:

- Application code
- API routes
- Database access
- Authentication
- Authorization
- AI tools
- Webhooks
- External integrations
- Environment configuration
- Deployment configuration
