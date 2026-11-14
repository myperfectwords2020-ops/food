import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WorkflowBuilder } from "@/components/admin/workflow-builder";

describe("WorkflowBuilder", () => {
  it("renders trigger and add step controls", () => {
    render(<WorkflowBuilder initialNodes={[]} />);
    expect(screen.getByRole("heading", { name: /Add step/i })).toBeInTheDocument();
    expect(screen.getAllByText(/TRIGGER/i).length).toBeGreaterThan(0);
  });
});
