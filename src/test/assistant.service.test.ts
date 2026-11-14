import { describe, expect, it } from "vitest";

import { mockAssistantService } from "@/services/assistant.mock";

describe("assistant mock service", () => {
  it("starts a conversation with welcome and prompts", async () => {
    const start = await mockAssistantService.startConversation({ customerName: "Amara" });
    expect(start.conversationId).toBeTruthy();
    expect(start.welcome.content.type).toBe("text");
    expect(start.suggestedPrompts.length).toBeGreaterThan(0);
  });

  it("returns comparison content for compare intent", async () => {
    const start = await mockAssistantService.startConversation();
    const result = await mockAssistantService.sendMessage({
      conversationId: start.conversationId,
      message: "Compare two serums",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.message.content.type).toBe("comparison");
    }
  });

  it("returns rate limit error for simulation token", async () => {
    const start = await mockAssistantService.startConversation();
    const result = await mockAssistantService.sendMessage({
      conversationId: start.conversationId,
      message: "#simulate-rate-limit",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("rate_limit");
  });
});
