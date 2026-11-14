import { describe, expect, it } from "vitest";

import { paymentReferenceFromSearchParams } from "@/modules/payments/payment-return-params";

describe("paymentReferenceFromSearchParams", () => {
  it("prefers reference over trxref", () => {
    expect(
      paymentReferenceFromSearchParams({
        reference: "eln_pay_abc",
        trxref: "eln_pay_other",
      }),
    ).toBe("eln_pay_abc");
  });

  it("falls back to trxref", () => {
    expect(paymentReferenceFromSearchParams({ trxref: "eln_pay_xyz" })).toBe("eln_pay_xyz");
  });

  it("handles duplicate reference array", () => {
    expect(
      paymentReferenceFromSearchParams({
        reference: ["eln_pay_dup", "eln_pay_dup"],
      }),
    ).toBe("eln_pay_dup");
  });
});
