import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LoginForm, RegisterForm } from "@/components/account/auth-forms";
import { renderWithProviders } from "@/test/test-utils";

vi.mock("@/app/actions/auth", () => ({
  loginAction: vi.fn(),
  registerAction: vi.fn(),
}));

describe("Auth forms", () => {
  it("login form has labeled fields and a submit control", () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Password")).toBeRequired();
    expect(screen.getByRole("button", { name: "Sign in" })).toHaveAttribute("type", "submit");
    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute(
      "href",
      "/account/register",
    );
  });

  it("register form has labeled fields and password hint", () => {
    renderWithProviders(<RegisterForm />);
    expect(screen.getByLabelText("First name")).toBeRequired();
    expect(screen.getByLabelText("Last name")).toBeRequired();
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Phone (optional)")).not.toBeRequired();
    expect(screen.getByText("At least 8 characters.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create account" })).toBeInTheDocument();
  });
});
