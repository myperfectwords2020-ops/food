import { describe, expect, it } from "vitest";

import {
  adminStatusFilterToPrisma,
  isCustomerVisibleRole,
  toCustomerConversationStatus,
} from "@/modules/conversations/conversation-dto";

describe("conversation DTO mapping", () => {
  it("maps prisma status to customer status", () => {
    expect(toCustomerConversationStatus("HANDOFF_REQUESTED")).toBe("handoff_requested");
  });

  it("maps admin filter aliases", () => {
    expect(adminStatusFilterToPrisma("handoff")).toBe("HANDOFF_REQUESTED");
    expect(adminStatusFilterToPrisma("open")).toBe("ACTIVE");
  });

  it("hides internal notes from customer-visible roles", () => {
    expect(isCustomerVisibleRole("INTERNAL_NOTE")).toBe(false);
    expect(isCustomerVisibleRole("HUMAN")).toBe(true);
  });
});
