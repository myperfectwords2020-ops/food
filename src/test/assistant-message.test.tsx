import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/analytics-events", () => ({
  recordAssistantRecommendationClickAction: vi.fn(async () => ({ ok: true })),
  recordAssistantAddToCartAction: vi.fn(async () => ({ ok: true })),
}));

import { AssistantMessage } from "@/components/assistant/assistant-message";

describe("AssistantMessage", () => {
  it("renders plain text without HTML injection", () => {
    render(
      <AssistantMessage
        message={{
          id: "1",
          role: "assistant",
          createdAt: new Date().toISOString(),
          content: { type: "text", text: "Try our hydrating cleanser." },
        }}
      />,
    );
    expect(screen.getByText("Try our hydrating cleanser.")).toBeInTheDocument();
  });
});
