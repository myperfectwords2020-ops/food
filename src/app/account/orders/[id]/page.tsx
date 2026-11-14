import { notFound } from "next/navigation";

import { AccountShell } from "@/components/account/account-shell";
import { OrderPaymentActions } from "@/components/order/order-payment-actions";
import { Status } from "@/components/page-ui";
import { formatNaira } from "@/lib/format";
import { orderNeedsPayment } from "@/lib/orders/order-payment-ui";
import { getAccountOrder } from "@/modules/account/account.service";

type Props = { params: Promise<{ id: string }> };

export default async function AccountOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await getAccountOrder(id);
  if (!order) notFound();

  const needsPayment = orderNeedsPayment(order);

  return (
    <AccountShell title={`Order ${order.orderNumber ?? order.id}`}>
      <div className="flex gap-2 mb-6 flex-wrap">
        <Status tone={order.paymentStatus === "paid" ? "success" : "warning"}>
          Payment {order.paymentStatus}
        </Status>
        <Status tone="neutral">{order.status.replaceAll("_", " ")}</Status>
      </div>

      {needsPayment ? <OrderPaymentActions orderId={order.id} variant="panel" /> : null}

      <div className="panel gc-account-order-panel">
        <h2 className="text-base font-bold mb-4">Items</h2>
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
          <span>{formatNaira(order.summary.delivery)}</span>
        </div>
        <div className="summary-line total">
          <span>Total</span>
          <span>{formatNaira(order.summary.total)}</span>
        </div>
      </div>
      <div className="panel mt-6 text-sm leading-7 text-muted-foreground gc-account-order-panel">
        <p>
          <strong className="text-foreground">Delivery</strong>
          <br />
          {order.address.street}, {order.address.city}, {order.address.state}
        </p>
        <p className="mt-3">{order.deliveryEstimate}</p>
      </div>
    </AccountShell>
  );
}
