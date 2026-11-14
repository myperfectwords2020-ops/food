import { describe, expect, it } from "vitest";

import { evaluateConditionGroup } from "@/modules/automations/conditions/condition-engine";

describe("automation condition engine", () => {
  it("evaluates AND groups", () => {
    const pass = evaluateConditionGroup(
      {
        all: [
          { field: "customer.lifecycle", operator: "equals", value: "CUSTOMER" },
          { field: "order.total", operator: "greaterThan", value: 1000 },
        ],
      },
      { customer: { lifecycle: "CUSTOMER" }, order: { total: 5000 } },
    );
    expect(pass).toBe(true);
  });

  it("rejects failing OR groups", () => {
    const pass = evaluateConditionGroup(
      {
        any: [{ field: "order.total", operator: "lessThan", value: 100 }],
      },
      { order: { total: 5000 } },
    );
    expect(pass).toBe(false);
  });
});
