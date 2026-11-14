import { createHmac } from "node:crypto";
import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { verifyPaystackWebhookSignature } from "@/modules/payments/paystack/paystack.webhook";

describe("Paystack webhook signature", () => {
  const prev = process.env["PAYSTACK_SECRET_KEY"];

  beforeEach(() => {
    process.env["PAYSTACK_SECRET_KEY"] = "test_secret";
  });

  afterEach(() => {
    if (prev === undefined) delete process.env["PAYSTACK_SECRET_KEY"];
    else process.env["PAYSTACK_SECRET_KEY"] = prev;
  });

  it("accepts valid signature", () => {
    const body = '{"event":"charge.success"}';
    const sig = createHmac("sha512", "test_secret").update(body).digest("hex");
    expect(() => verifyPaystackWebhookSignature(body, sig)).not.toThrow();
  });

  it("rejects invalid signature", () => {
    expect(() => verifyPaystackWebhookSignature("{}", "bad")).toThrow(/signature/i);
  });
});
