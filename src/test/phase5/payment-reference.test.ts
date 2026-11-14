import { describe, expect, it } from "vitest";

import {
  generatePaymentReference,
  referenceForProviderInitialize,
} from "@/modules/payments/payment-reference";

describe("payment reference", () => {
  it("generates unique eln_pay prefixes", () => {
    const a = generatePaymentReference();
    const b = generatePaymentReference();
    expect(a).toMatch(/^eln_pay_[a-f0-9]{32}$/);
    expect(b).not.toBe(a);
  });

  it("mints a fresh reference on each provider initialize", () => {
    const first = referenceForProviderInitialize();
    const second = referenceForProviderInitialize();
    expect(first).not.toBe(second);
  });
});