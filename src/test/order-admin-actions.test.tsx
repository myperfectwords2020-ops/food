import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OrderAdminActions } from "@/components/admin/order-admin-actions";

vi.mock("@/app/actions/admin", () => ({
  updateAdminOrderStatusAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("OrderAdminActions", () => {
  it("shows current status and next status options for a paid order", () => {
    render(
      <OrderAdminActions
        orderId="ord-1"
        customerEmail="a@example.com"
        initialStatus="paid"
        nextStatusOptions={["processing", "shipped", "delivered", "cancelled"]}
      />,
    );
    expect(screen.getByText(/awaiting fulfillment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/move to/i)).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Preparing order" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Out for delivery" })).toBeInTheDocument();
  });

  it("explains when no further transitions exist", () => {
    render(
      <OrderAdminActions
        orderId="ord-2"
        customerEmail="b@example.com"
        initialStatus="delivered"
        nextStatusOptions={[]}
      />,
    );
    expect(screen.getByText(/no further status changes/i)).toBeInTheDocument();
  });
});
