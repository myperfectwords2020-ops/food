import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EmptyState, Status } from "@/components/page-ui";
import { formatNaira } from "@/lib/format";
import { adminService } from "@/services/index";

type Props = { params: Promise<{ id: string }> };

export default async function AdminCustomerDetailPage({ params }: Props) {
  const { id } = await params;
  const customer = await adminService.getCustomer(id);
  if (!customer) notFound();

  return (
    <>
      <AdminBreadcrumbs
        items={[
          { href: "/admin/dashboard", label: "Admin" },
          { href: "/admin/customers", label: "Customers" },
          { label: customer.name },
        ]}
      />
      <AdminPageHeader
        title={customer.name}
        description={customer.email}
        actions={
          customer.leadId ? (
            <Link href={`/admin/leads/${customer.leadId}`} className="btn btn-outline btn-sm">
              View lead
            </Link>
          ) : null
        }
      />
      <div className="admin-grid">
        <section className="panel text-sm leading-7">
          <h2 className="text-sm font-bold mb-2">Profile & contact</h2>
          <p>{customer.phone}</p>
          <p>
            Lifecycle: <Status tone="neutral">{customer.lifecycle.replaceAll("_", " ")}</Status>
          </p>
          <p>
            {customer.ordersCount} orders · {formatNaira(customer.totalSpent)} lifetime
          </p>
          <p className="text-muted-foreground">{customer.preferencesSummary}</p>
        </section>
        <section className="panel text-sm">
          <h2 className="text-sm font-bold mb-2">Skin profile</h2>
          <p className="leading-7">{customer.skinProfile}</p>
        </section>
      </div>
      <section className="panel mt-4 overflow-x-auto">
        <div className="panel-head">
          <h2>Order history</h2>
        </div>
        {customer.orderHistory.length === 0 ? (
          <EmptyState
            title="No orders linked"
            copy="Match orders by customer email when API connects."
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {customer.orderHistory.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/orders/${o.id}`}>{o.id}</Link>
                  </td>
                  <td>{formatNaira(o.total)}</td>
                  <td>{o.status}</td>
                  <td>{o.displayDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <div className="admin-grid mt-4">
        <section className="panel">
          <h2 className="text-sm font-bold mb-2">Recommendations</h2>
          <ul className="text-sm space-y-1">
            {customer.recommendationSlugs.map((slug) => (
              <li key={slug}>
                <Link href={`/products/${slug}`}>{slug}</Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel">
          <h2 className="text-sm font-bold mb-2">Conversations</h2>
          {customer.conversationIds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No threads yet.</p>
          ) : (
            <ul className="text-sm space-y-1">
              {customer.conversationIds.map((cid) => (
                <li key={cid}>
                  <Link href={`/admin/conversations/${cid}`}>{cid}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <section className="panel mt-4">
        <h2 className="text-sm font-bold mb-2">Activity timeline</h2>
        <ol className="text-sm space-y-2 list-decimal pl-5">
          {customer.activityTimeline.map((e) => (
            <li key={e.id}>
              {e.label} · {new Date(e.at).toLocaleString()}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
