import Link from "next/link";

import { AccountShell } from "@/components/account/account-shell";
import { OrderPaymentActions } from "@/components/order/order-payment-actions";
import { EmptyState, Status } from "@/components/page-ui";
import { formatNaira } from "@/lib/format";
import { orderNeedsPayment } from "@/lib/orders/order-payment-ui";
import { pageMetadata } from "@/lib/seo";
import { listAccountOrderSummaries } from "@/modules/account/account.service";

export const metadata = pageMetadata("Your orders", "Track Greencart orders.");

export default async function AccountOrdersPage() {
  const orders = await listAccountOrderSummaries();

  return (
    <AccountShell title="Orders">
      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          copy="When you shop with us, your orders will appear here."
        />
      ) : (
        <div className="panel overflow-x-auto gc-account-orders-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const needsPayment = orderNeedsPayment(order);
                return (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/account/orders/${order.id}`} className="font-bold">
                        {order.orderNumber ?? order.id}
                      </Link>
                    </td>
                    <td>{order.date}</td>
                    <td>{order.itemCount}</td>
                    <td>{formatNaira(order.total)}</td>
                    <td>
                      <Status tone={order.paymentStatus === "paid" ? "success" : "warning"}>
                        {order.status.replaceAll("_", " ")}
                      </Status>
                    </td>
                    <td>
                      {needsPayment ? (
                        <OrderPaymentActions orderId={order.id} variant="inline" />
                      ) : (
                        <Status tone={order.paymentStatus === "paid" ? "success" : "neutral"}>
                          {order.paymentStatus === "paid" ? "Paid" : "—"}
                        </Status>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AccountShell>
  );
}
