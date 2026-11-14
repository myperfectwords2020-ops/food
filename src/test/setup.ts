import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

const emptySummary = {
  lines: [],
  subtotal: 0,
  delivery: null,
  discount: 0,
  total: 0,
  currency: "NGN" as const,
};

vi.mock("@/app/actions/commerce", () => ({
  getCartSummaryAction: vi.fn(async () => emptySummary),
  getCartSummaryFromLinesAction: vi.fn(async () => emptySummary),
  getCheckoutSummaryAction: vi.fn(async () => emptySummary),
  getCheckoutSummaryFromLinesAction: vi.fn(async () => emptySummary),
  submitCheckoutAction: vi.fn(),
}));

vi.mock("@/app/actions/cart", () => ({
  fetchCustomerCartAction: vi.fn(async () => null),
  syncCartItemAction: vi.fn(),
  mergeLocalCartAction: vi.fn(),
}));

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
