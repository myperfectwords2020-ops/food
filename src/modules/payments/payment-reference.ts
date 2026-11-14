import { randomBytes } from "node:crypto";

/** Cryptographically safe Paystack payment reference (not predictable). */
export function generatePaymentReference(): string {
  return `eln_pay_${randomBytes(16).toString("hex")}`;
}

/**
 * Reference for Paystack /transaction/initialize.
 * Paystack rejects duplicate references, so every initialize (including retries) uses a new one.
 */
export function referenceForProviderInitialize(): string {
  return generatePaymentReference();
}
