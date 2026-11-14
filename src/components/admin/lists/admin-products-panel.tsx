"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { AdminListFilters } from "@/components/admin/admin-list-filters";
import { AdminQueryState } from "@/components/admin/lists/admin-query-state";
import { EmptyState, Status } from "@/components/page-ui";
import { useAdminProductsQuery } from "@/hooks/queries/admin/use-admin-products";
import { formatNaira } from "@/lib/format";

function AdminProductsTable() {
  const { data: products, isLoading, isError, error } = useAdminProductsQuery();

  return (
    <AdminQueryState
      isLoading={isLoading}
      isError={isError}
      errorMessage={error instanceof Error ? error.message : undefined}
    >
      {products && products.length === 0 ? (
        <EmptyState title="No products" copy="Create a product or adjust filters." />
      ) : null}
      {products && products.length > 0 ? (
        <div className="panel overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="table-product">
                      <Image src={p.image} alt="" width={36} height={42} className="object-cover" />
                      <Link href={`/admin/products/${p.id}/edit`}>{p.name}</Link>
                    </div>
                  </td>
                  <td>{p.category}</td>
                  <td>{formatNaira(p.price)}</td>
                  <td>{p.stock}</td>
                  <td>
                    <Status tone={p.status === "active" ? "success" : "neutral"}>{p.status}</Status>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </AdminQueryState>
  );
}

export function AdminProductsPanel() {
  return (
    <>
      <Suspense fallback={null}>
        <AdminListFilters
          fields={[
            { name: "q", label: "Search" },
            {
              name: "status",
              label: "Status",
              type: "select",
              options: [
                { value: "active", label: "Active" },
                { value: "draft", label: "Draft" },
                { value: "archived", label: "Archived" },
              ],
            },
          ]}
        />
      </Suspense>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <AdminProductsTable />
      </Suspense>
    </>
  );
}
