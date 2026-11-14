import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OrderAdminActions } from "@/components/admin/order-admin-actions";
import { Status } from "@/components/page-ui";
import { formatNaira } from "@/lib/format";
import { getAdminOrderStatusOptions } from "@/modules/orders/admin-order.service";
import { adminService } from "@/services/index";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await adminService.getOrder(id);
  if (!order) notFound();
  const nextStatusOptions = getAdminOrderStatusOptions(order.status);

  return (
    <>
      <AdminBreadcrumbs
        items={[
          { href: "/admin/dashboard", label: "Admin" },
          { href: "/admin/orders", label: "Orders" },
          { label: order.id },
        ]}
      />
      <AdminPageHeader
        title={`Order ${order.id}`}
        description={`${order.customerName} · ${new Date(order.createdAt).toLocaleString()}`}
        actions={
          <Link href="/admin/orders" className="btn btn-outline btn-sm">
            Back to orders
          </Link>
        }
      />
      <OrderAdminActions
        orderId={order.id}
        customerEmail={order.customer.email}
        paymentReference={order.paymentReference}
        initialStatus={order.status}
        nextStatusOptions={nextStatusOptions}
      />
      <div className="admin-grid mt-4">
        <section className="panel" id="payment-panel">
          <div className="panel-head">
            <h2>Payment</h2>
          </div>
          <p className="text-sm">
            Status:{" "}
            <Status tone={order.paymentStatus === "paid" ? "success" : "warning"}>
              {order.paymentStatus}
            </Status>
          </p>
          <p className="text-sm mt-2">Fulfillment: {order.status}</p>
          {order.paymentReference ? (
            <p className="text-xs text-muted-foreground mt-2">
              Paystack reference:{" "}
              <span className="font-mono text-foreground">{order.paymentReference}</span>
            </p>
          ) : null}
        </section>
        <section className="panel">
          <div className="panel-head">
            <h2>Totals</h2>
          </div>
          <dl className="text-sm space-y-1 m-0">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatNaira(order.summary.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Delivery</dt>
              <dd>{order.summary.delivery != null ? formatNaira(order.summary.delivery) : "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Discount</dt>
              <dd>{formatNaira(order.summary.discount)}</dd>
            </div>
            <div className="flex justify-between font-bold">
              <dt>Total</dt>
              <dd>{formatNaira(order.summary.total)}</dd>
            </div>
          </dl>
        </section>
        <section className="panel">
          <div className="panel-head">
            <h2>Customer & delivery</h2>
          </div>
          <p className="text-sm leading-7">
            {order.customer.firstName} {order.customer.lastName}
            <br />
            {order.customer.email}
            <br />
            {order.customer.phone}
          </p>
          <p className="text-sm leading-7 mt-4">
            {order.address.street}
            <br />
            {order.address.city}, {order.address.state}
          </p>
          <p className="text-xs text-muted-foreground mt-2">{order.deliveryEstimate}</p>
        </section>
      </div>
      <section className="panel mt-4 overflow-x-auto">
        <div className="panel-head">
          <h2>Line items</h2>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Line total</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((l) => (
              <tr key={l.productId}>
                <td>
                  <div className="table-product">
                    <Image src={l.image} alt="" width={36} height={42} className="object-cover" />
                    <Link href={`/admin/products/${l.productId}/edit`}>{l.name}</Link>
                  </div>
                </td>
                <td>{l.quantity}</td>
                <td>{formatNaira(l.unitPrice)}</td>
                <td>{formatNaira(l.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="panel mt-4" id="order-timeline">
        <div className="panel-head">
          <h2>Timeline</h2>
        </div>
        <ol className="text-sm space-y-3 list-decimal pl-5">
          {order.timeline.map((e) => (
            <li key={e.id}>
              <strong>{e.label}</strong>
              <span className="text-muted-foreground"> · {new Date(e.at).toLocaleString()}</span>
              {e.detail ? <p className="text-xs text-muted-foreground m-0">{e.detail}</p> : null}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
