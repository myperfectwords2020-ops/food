import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ContactForm } from "@/components/contact/contact-form";
import { renderWithProviders } from "@/test/test-utils";

vi.mock("@/app/actions/crm", () => ({
  submitContactLeadAction: vi.fn(async () => ({ ok: true as const })),
}));

describe("ContactForm", () => {
  it("renders labeled fields and submit button", () => {
    renderWithProviders(<ContactForm />);
    expect(screen.getByRole("heading", { name: "Send a message" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeRequired();
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Phone (optional)")).not.toBeRequired();
    expect(screen.getByLabelText("Message")).toBeRequired();
    expect(screen.getByRole("button", { name: "Send message" })).toHaveAttribute("type", "submit");
  });
});
