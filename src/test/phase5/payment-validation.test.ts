import { describe, expect, it } from "vitest";

import {
  assertPaymentAmountAndCurrency,
  orderBlocksNewPayment,
  orderEligibleForPayment,
} from "@/modules/payments/payment-validation";
import {
  paystackAmountFromMinor,
  paystackMinorFromProviderAmount,
} from "@/modules/payments/paystack/paystack.client";

describe("payment validation", () => {
  it("accepts matching amount and currency", () => {
    expect(() =>
      assertPaymentAmountAndCurrency({
        expectedAmountMinor: 180_000,
        expectedCurrency: "NGN",
        providerAmountMinor: 180_000,
        providerCurrency: "NGN",
      }),
    ).not.toThrow();
  });

  it("rejects amount mismatch", () => {
    expect(() =>
      assertPaymentAmountAndCurrency({
        expectedAmountMinor: 180_000,
        expectedCurrency: "NGN",
        providerAmountMinor: 179_000,
        providerCurrency: "NGN",
      }),
    ).toThrow(/amount/i);
  });

  it("rejects currency mismatch", () => {
    expect(() =>
      assertPaymentAmountAndCurrency({
        expectedAmountMinor: 100,
        expectedCurrency: "NGN",
        providerAmountMinor: 100,
        providerCurrency: "USD",
      }),
    ).toThrow(/currency/i);
  });

  it("knows eligible order statuses", () => {
    expect(orderEligibleForPayment("PENDING_PAYMENT")).toBe(true);
    expect(orderBlocksNewPayment("PAID")).toBe(true);
    expect(orderBlocksNewPayment("PENDING_PAYMENT")).toBe(false);
  });
});

describe("Paystack NGN minor units", () => {
  it("maps kobo 1:1 for NGN", () => {
    expect(paystackAmountFromMinor(1_800_000, "NGN")).toBe(1_800_000);
    expect(paystackMinorFromProviderAmount(1_800_000, "NGN")).toBe(1_800_000);
  });

  it("rejects non-NGN", () => {
    expect(() => paystackAmountFromMinor(100, "USD")).toThrow();
  });
});
