import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/app/actions/admin", () => ({
  saveAdminProductAction: vi.fn(),
  archiveAdminProductAction: vi.fn(),
  uploadAdminProductImageAction: vi.fn(),
}));

import { AdminProductForm } from "@/components/admin/admin-product-form";

describe("AdminProductForm", () => {
  it("renders create mode fields", () => {
    render(<AdminProductForm mode="create" />);
    expect(screen.getByLabelText(/Product name/i)).toBeInTheDocument();
    expect(screen.getByText(/Product images/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create product/i })).toBeInTheDocument();
  });
});
