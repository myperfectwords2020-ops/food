import { describe, expect, it } from "vitest";

import {
  assertStatusTransition,
  conversationBlocksAiResponses,
} from "@/modules/conversations/conversation-status";
import { ValidationError } from "@/lib/errors/app-error";

describe("conversation status transitions", () => {
  it("allows ACTIVE to HANDOFF_REQUESTED", () => {
    expect(() => assertStatusTransition("ACTIVE", "HANDOFF_REQUESTED")).not.toThrow();
  });

  it("rejects CLOSED to HUMAN_ASSIGNED without reopen", () => {
    expect(() => assertStatusTransition("CLOSED", "HUMAN_ASSIGNED")).toThrow(ValidationError);
  });

  it("blocks AI after human assignment", () => {
    expect(conversationBlocksAiResponses("HUMAN_ASSIGNED")).toBe(true);
    expect(conversationBlocksAiResponses("ACTIVE")).toBe(false);
  });
});
