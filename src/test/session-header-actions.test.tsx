import { screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { SessionHeaderActions } from "@/components/auth/session-header-actions";
import { renderWithProviders } from "@/test/test-utils";

const useSessionMock = vi.fn();

vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
}));

vi.mock("@/components/account/sign-out-button", () => ({
  SignOutButton: () => <button type="button">Sign out</button>,
}));

describe("SessionHeaderActions", () => {
  beforeEach(() => {
    useSessionMock.mockReset();
  });

  it("shows Account when session has a user", () => {
    useSessionMock.mockReturnValue({
      status: "authenticated",
      data: { user: { id: "u1", email: "a@b.com", role: "CUSTOMER" } },
    });

    renderWithProviders(<SessionHeaderActions />);

    expect(screen.getByRole("link", { name: "Account" })).toHaveAttribute("href", "/account");
    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
  });

  it("shows Sign in when unauthenticated", () => {
    useSessionMock.mockReturnValue({
      status: "unauthenticated",
      data: null,
    });

    renderWithProviders(<SessionHeaderActions />);

    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/account/login");
  });
});
