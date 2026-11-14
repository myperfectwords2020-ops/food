import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { getOrderForConfirmation } from "@/app/actions/commerce";
import { OrderPaymentActions } from "@/components/order/order-payment-actions";
import { orderNeedsPayment } from "@/lib/orders/order-payment-ui";
import { ProductCard } from "@/components/product-card";
import { Status } from "@/components/page-ui";
import { RouteLink } from "@/components/ui/route-link";
import { requireCustomerRequestContext } from "@/lib/auth/request-context";
import { formatNaira } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { verifyPaymentForCustomer } from "@/modules/payments/payment-application.service";
import { paymentReferenceFromSearchParams } from "@/modules/payments/payment-return-params";
import { catalogService } from "@/services/index";

export const metadata = pageMetadata("Order confirmed", "Your Greencart order status.");

type Props = {
  searchParams: Promise<{
    order?: string;
    reference?: string | string[];
    trxref?: string | string[];
  }>;
};

export default async function OrderConfirmationPage({ searchParams }: Props) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const orderId = sp.order ?? cookieStore.get("elanskin_order_id")?.value;
  if (!orderId) notFound();

  const paymentReference = paymentReferenceFromSearchParams(sp);

  let verificationNote: string | null = null;
  if (paymentReference) {
    try {
      const ctx = await requireCustomerRequestContext();
      const outcome = await verifyPaymentForCustomer(ctx, orderId, paymentReference);
      if (outcome.paymentStatus === "paid") {
        redirect(`/order-confirmation?order=${encodeURIComponent(orderId)}`);
      }
    } catch {
      verificationNote =
        "We could not confirm payment yet. If you completed checkout, wait a moment and refresh, or check your order history.";
    }
  }

  const order = await getOrderForConfirmation(orderId);
  if (!order) notFound();

  const recommendations = await catalogService.getRelatedProducts(order.lines[0]?.slug ?? "", 3);

  const isPaid = order.paymentStatus === "paid";
  const isPending = orderNeedsPayment(order);
  const isFailed = order.status === "cancelled" && !isPaid;

  const heading = isPaid
    ? "Thank you."
    : isPending
      ? "Almost there."
      : isFailed
        ? "Payment issue"
        : "Order received";
  const lead = isPaid
    ? `${order.customer.firstName}, we're preparing your order. Delivery updates will go to ${order.customer.email}.`
    : isPending
      ? `${order.customer.firstName}, your order is saved—complete payment to confirm it. You can also pay later from Account → Orders.`
      : isFailed
        ? "This payment did not complete. You can retry if inventory is still available."
        : `${order.customer.firstName}, view your order details below.`;

  return (
    <div className="page-shell text-center">
      <div
        className={`mx-auto grid place-items-center w-16 h-16 rounded-full ${
          isPaid ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        <span aria-hidden>{isPaid ? "✓" : "…"}</span>
      </div>
      <p className="eyebrow mt-6">Order {order.orderNumber ?? order.id}</p>
      <h1 className="text-7xl">{heading}</h1>
      <p className="max-w-xl mx-auto text-muted-foreground leading-7">{lead}</p>
      {verificationNote && isPending ? (
        <p className="max-w-lg mx-auto text-sm text-muted-foreground mt-3" role="status">
          {verificationNote}
        </p>
      ) : null}
      <div className="flex justify-center gap-2 mt-4 flex-wrap">
        <Status tone={isPaid ? "success" : isFailed ? "danger" : "warning"}>
          Payment {order.paymentStatus}
        </Status>
        <Status tone="neutral">{order.status.replaceAll("_", " ")}</Status>
      </div>
      {isPending ? (
        <div className="max-w-xl mx-auto mt-6 text-left">
          <OrderPaymentActions orderId={order.id} variant="panel" />
        </div>
      ) : null}
      <div className="panel max-w-2xl mx-auto my-10 text-left">
        <h2 className="text-lg font-bold mb-3">Order summary</h2>
        {order.lines.map((line) => (
          <div className="summary-line" key={line.productId}>
            <span>
              {line.name} × {line.quantity}
            </span>
            <span>{formatNaira(line.lineTotal)}</span>
          </div>
        ))}
        <div className="summary-line">
          <span>Delivery</span>
          <span>{order.summary.delivery != null ? formatNaira(order.summary.delivery) : "—"}</span>
        </div>
        <div className="summary-line total">
          <span>Total</span>
          <span>{formatNaira(order.summary.total)}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Delivery to {order.address.street}, {order.address.city}, {order.address.state}.{" "}
          {order.deliveryEstimate}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <RouteLink href={`/account/orders/${order.id}`}>View order</RouteLink>
        <RouteLink href="/shop" variant="outline">
          Continue shopping
        </RouteLink>
      </div>
      {recommendations.length > 0 ? (
        <>
          <div className="section-heading text-left mt-24">
            <h2>You may also like</h2>
          </div>
          <div className="product-grid text-left">
            {recommendations.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
