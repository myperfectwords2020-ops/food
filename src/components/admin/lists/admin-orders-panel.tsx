"use client";

import Link from "next/link";
import { Suspense } from "react";

import { AdminListFilters } from "@/components/admin/admin-list-filters";
import { AdminMockBanner } from "@/components/admin/admin-mock-banner";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminQueryState } from "@/components/admin/lists/admin-query-state";
import { EmptyState, Status } from "@/components/page-ui";
import { useAdminOrdersQuery } from "@/hooks/queries/admin/use-admin-orders";
import { formatNaira } from "@/lib/format";

function AdminOrdersTable() {
  const { data, isLoading, isError, error } = useAdminOrdersQuery();

  return (
    <AdminQueryState
      isLoading={isLoading}
      isError={isError}
      errorMessage={error instanceof Error ? error.message : undefined}
    >
      {data && data.items.length === 0 ? (
        <EmptyState
          title="No orders match"
          copy="Try clearing filters or check back after checkout."
        />
      ) : null}
      {data && data.items.length > 0 ? (
        <>
          <div className="panel overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/orders/${o.id}`}>{o.id}</Link>
                    </td>
                    <td>
                      <div>{o.customerName}</div>
                      <small className="text-muted-foreground">{o.customerEmail}</small>
                    </td>
                    <td>{o.itemCount}</td>
                    <td>{formatNaira(o.total)}</td>
                    <td>
                      <Status tone={o.paymentStatus === "paid" ? "success" : "warning"}>
                        {o.paymentStatus}
                      </Status>
                    </td>
                    <td>{o.status}</td>
                    <td>{o.displayDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminPagination page={data.page} totalPages={data.totalPages} />
        </>
      ) : null}
    </AdminQueryState>
  );
}

export function AdminOrdersPanel() {
  return (
    <>
      <AdminMockBanner />
      <Suspense fallback={null}>
        <AdminListFilters
          fields={[
            { name: "q", label: "Search" },
            {
              name: "status",
              label: "Fulfillment",
              type: "select",
              options: [
                { value: "pending_payment", label: "Pending payment" },
                { value: "processing", label: "Processing" },
                { value: "shipped", label: "Shipped" },
                { value: "delivered", label: "Delivered" },
              ],
            },
            {
              name: "payment",
              label: "Payment",
              type: "select",
              options: [
                { value: "paid", label: "Paid" },
                { value: "pending", label: "Pending" },
                { value: "failed", label: "Failed" },
              ],
            },
          ]}
        />
      </Suspense>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <AdminOrdersTable />
      </Suspense>
    </>
  );
}
