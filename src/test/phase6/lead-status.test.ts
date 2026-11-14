import { describe, expect, it } from "vitest";

import { assertLeadStatusTransition } from "@/modules/leads/lead-status";
import { ValidationError } from "@/lib/errors/app-error";

describe("lead status transitions", () => {
  it("allows NEW to CONTACTED", () => {
    expect(() => assertLeadStatusTransition("NEW", "CONTACTED")).not.toThrow();
  });

  it("rejects CONVERTED to NEW", () => {
    expect(() => assertLeadStatusTransition("CONVERTED", "NEW")).toThrow(ValidationError);
  });

  it("allows QUALIFIED to CONVERTED", () => {
    expect(() => assertLeadStatusTransition("QUALIFIED", "CONVERTED")).not.toThrow();
  });
});
