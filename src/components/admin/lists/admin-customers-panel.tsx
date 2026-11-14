"use client";

import Link from "next/link";
import { Suspense } from "react";

import { AdminListFilters } from "@/components/admin/admin-list-filters";
import { AdminQueryState } from "@/components/admin/lists/admin-query-state";
import { EmptyState } from "@/components/page-ui";
import { useAdminCustomersQuery } from "@/hooks/queries/admin/use-admin-customers";
import { formatNaira } from "@/lib/format";

function AdminCustomersTable() {
  const { data: customers, isLoading, isError, error } = useAdminCustomersQuery();

  return (
    <AdminQueryState
      isLoading={isLoading}
      isError={isError}
      errorMessage={error instanceof Error ? error.message : undefined}
    >
      {customers && customers.length === 0 ? (
        <EmptyState title="No customers" copy="Try another search." />
      ) : null}
      {customers && customers.length > 0 ? (
        <div className="panel overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Orders</th>
                <th>Spent</th>
                <th>Lifecycle</th>
                <th>Activity</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/admin/customers/${c.id}`}>{c.name}</Link>
                  </td>
                  <td>{c.email}</td>
                  <td>{c.ordersCount}</td>
                  <td>{formatNaira(c.totalSpent)}</td>
                  <td>{c.lifecycle}</td>
                  <td>{c.lastActivity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </AdminQueryState>
  );
}

export function AdminCustomersPanel() {
  return (
    <>
      <Suspense fallback={null}>
        <AdminListFilters
          fields={[
            { name: "q", label: "Search" },
            {
              name: "lifecycle",
              label: "Lifecycle",
              type: "select",
              options: [
                { value: "CUSTOMER", label: "Customer" },
                { value: "REPEAT_CUSTOMER", label: "Repeat customer" },
                { value: "QUALIFIED", label: "Qualified" },
                { value: "LEAD", label: "Lead" },
              ],
            },
          ]}
        />
      </Suspense>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <AdminCustomersTable />
      </Suspense>
    </>
  );
}
