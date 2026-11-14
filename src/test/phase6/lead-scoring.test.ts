import { describe, expect, it } from "vitest";

import { scoreLead } from "@/modules/leads/lead-scoring.service";

describe("lead scoring", () => {
  it("scores higher with routine completion and contact info", () => {
    const result = scoreLead({
      email: "test@example.com",
      phone: "+2348012345678",
      source: "ROUTINE",
      routineCompleted: true,
      concern: "Dark spots",
    });
    expect(result.score).toBeGreaterThanOrEqual(55);
    expect(result.suggestedStatus).toBe("QUALIFIED");
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("stays NEW with minimal signals", () => {
    const result = scoreLead({
      email: null,
      phone: null,
      source: "WEBSITE",
    });
    expect(result.suggestedStatus).toBe("NEW");
  });
});
