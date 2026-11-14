import { describe, expect, it } from "vitest";

import {
  normalizeTriggerType,
  triggerTypeForDomainEvent,
} from "@/modules/automations/types/triggers";
import { DomainEventTypes } from "@/lib/events/domain-events";

describe("automation trigger registry", () => {
  it("normalizes dotted triggers", () => {
    expect(normalizeTriggerType("order.paid")).toBe("ORDER_PAID");
  });

  it("maps domain events", () => {
    expect(triggerTypeForDomainEvent(DomainEventTypes.ORDER_PAID)).toBe("ORDER_PAID");
  });

  it("rejects unknown triggers", () => {
    expect(normalizeTriggerType("totally.custom")).toBeNull();
  });
});
