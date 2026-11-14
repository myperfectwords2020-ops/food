import { describe, expect, it } from "vitest";

import { renderTemplate, validateTemplateVariables } from "@/modules/notifications/template-render.service";

describe("notification template render", () => {
  it("renders allowed variables", () => {
    const out = renderTemplate(
      { subject: "Hi {{customer.firstName}}", body: "Order {{order.orderNumber}}" },
      { customer: { firstName: "Ada" }, order: { orderNumber: "EL-1" } },
    );
    expect(out.subject).toBe("Hi Ada");
    expect(out.bodyText).toBe("Order EL-1");
  });

  it("rejects unknown variables", () => {
    const unknown = validateTemplateVariables("{{user.password}}");
    expect(unknown).toContain("user.password");
  });
});
