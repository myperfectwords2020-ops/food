"use client";

import { AdminQueryState } from "@/components/admin/lists/admin-query-state";
import { InventoryAdjustForm } from "@/components/admin/inventory-adjust-form";
import { EmptyState, Status } from "@/components/page-ui";
import { useAdminInventoryQuery } from "@/hooks/queries/admin/use-admin-inventory";

export function AdminInventoryPanel() {
  const { data, isLoading, isError, error } = useAdminInventoryQuery();
  const rows = data?.rows ?? [];
  const transactions = data?.transactions ?? [];
  const low = rows.filter((r) => r.lowStock);
  const out = rows.filter((r) => r.outOfStock);

  return (
    <AdminQueryState
      isLoading={isLoading}
      isError={isError}
      errorMessage={error instanceof Error ? error.message : undefined}
    >
      <>
        <div className="metric-grid mb-4">
          <div className="metric-card">
            <p>SKUs tracked</p>
            <strong>{rows.length}</strong>
          </div>
          <div className="metric-card">
            <p>Low stock</p>
            <strong>{low.length}</strong>
          </div>
          <div className="metric-card">
            <p>Out of stock</p>
            <strong>{out.length}</strong>
          </div>
        </div>
        {rows.length === 0 ? (
          <EmptyState title="No inventory" copy="Add products to track stock." />
        ) : (
          <div className="panel overflow-x-auto mb-6">
            <div className="panel-head">
              <h2>Stock levels</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ product, lowStock, outOfStock }) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.stock}</td>
                    <td>
                      {outOfStock ? (
                        <Status tone="danger">Out of stock</Status>
                      ) : lowStock ? (
                        <Status tone="warning">Low stock</Status>
                      ) : (
                        <Status tone="success">Healthy</Status>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {rows.slice(0, 4).map(({ product }) => (
            <InventoryAdjustForm
              key={product.id}
              productId={product.id}
              productName={product.name}
            />
          ))}
        </div>
        <section className="panel overflow-x-auto">
          <div className="panel-head">
            <h2>Recent transactions</h2>
          </div>
          {transactions.length === 0 ? (
            <EmptyState title="No transactions" copy="Adjustments will appear here." />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Change</th>
                  <th>Balance</th>
                  <th>Note</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 20).map((t) => (
                  <tr key={t.id}>
                    <td>{t.productName}</td>
                    <td>{t.type}</td>
                    <td>{t.delta > 0 ? `+${t.delta}` : t.delta}</td>
                    <td>{t.balanceAfter}</td>
                    <td>{t.note}</td>
                    <td>{new Date(t.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </>
    </AdminQueryState>
  );
}
