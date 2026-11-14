import Link from "next/link";

import { OrderPaymentRetry } from "@/components/order/order-payment-retry";

type Props = {
  orderId: string;
  /** Compact row for orders table; default panel for order detail. */
  variant?: "inline" | "panel";
};

export function OrderPaymentActions({ orderId, variant = "panel" }: Props) {
  if (variant === "inline") {
    return (
      <div className="gc-order-pay-inline">
        <OrderPaymentRetry orderId={orderId} label="Pay now" size="sm" />
      </div>
    );
  }

  return (
    <aside className="gc-order-pay-panel" aria-labelledby="order-pay-heading">
      <h2 id="order-pay-heading">Payment required</h2>
      <p>
        This order is waiting for payment. Pay with Paystack to confirm it—we verify the amount on
        our servers before marking it paid.
      </p>
      <div className="gc-order-pay-actions">
        <OrderPaymentRetry orderId={orderId} label="Pay with Paystack" />
        <Link
          href={`/order-confirmation?order=${encodeURIComponent(orderId)}`}
          className="gc-auth-link"
        >
          View payment page
        </Link>
      </div>
    </aside>
  );
}
