import { ValidationError } from "@/lib/errors/app-error";

export type PaymentAmountCheck = {
  expectedAmountMinor: number;
  expectedCurrency: string;
  providerAmountMinor: number;
  providerCurrency: string;
};

export function assertPaymentAmountAndCurrency(input: PaymentAmountCheck): void {
  if (input.expectedCurrency !== input.providerCurrency) {
    throw new ValidationError("Payment currency does not match the order.");
  }
  if (input.expectedAmountMinor !== input.providerAmountMinor) {
    throw new ValidationError("Payment amount does not match the order total.");
  }
}

export function orderEligibleForPayment(orderStatus: string): boolean {
  return orderStatus === "PENDING_PAYMENT";
}

export function orderBlocksNewPayment(orderStatus: string): boolean {
  return orderStatus === "PAID" || orderStatus === "CANCELLED" || orderStatus === "REFUNDED";
}
