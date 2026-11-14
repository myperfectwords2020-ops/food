/** True when the customer can still pay for an unpaid checkout order. */
export function orderNeedsPayment(order: { status: string; paymentStatus: string }): boolean {
  return order.status === "pending_payment" && order.paymentStatus !== "paid";
}
