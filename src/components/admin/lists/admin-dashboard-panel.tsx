"use client";

import Link from "next/link";
import { Suspense } from "react";

import { AdminAccessibleChart } from "@/components/admin/admin-accessible-chart";
import { AdminDateRangeFilter } from "@/components/admin/admin-date-range-filter";
import { AdminMockBanner } from "@/components/admin/admin-mock-banner";
import { AdminQueryState } from "@/components/admin/lists/admin-query-state";
import { EmptyState, Status } from "@/components/page-ui";
import { useAdminDashboardQuery } from "@/hooks/queries/admin/use-admin-dashboard";
import { formatNaira } from "@/lib/format";

function DashboardContent() {
  const { data: dash, isLoading, isError, error } = useAdminDashboardQuery();

  return (
    <AdminQueryState
      isLoading={isLoading}
      isError={isError}
      errorMessage={error instanceof Error ? error.message : undefined}
    >
      {dash ? (
        <>
          <p className="text-sm text-muted-foreground mb-4">{dash.rangeLabel}</p>
          {dash.dataSource === "mock" ? <AdminMockBanner /> : null}
          <div className="metric-grid">
            {(
              [
                ["Revenue", formatNaira(dash.revenue.value), dash.revenue.changeLabel],
                ["Orders", String(dash.orders.value), dash.orders.changeLabel],
                ["Customers", String(dash.customers.value), dash.customers.changeLabel],
                ["New customers", String(dash.newCustomers.value), dash.newCustomers.changeLabel],
                ["Leads", String(dash.leads.value), dash.leads.changeLabel],
              ] as const
            ).map(([label, value, hint]) => (
              <div key={label} className="metric-card">
                <p>{label}</p>
                <strong>{value}</strong>
                <small>{hint}</small>
              </div>
            ))}
          </div>
          <div className="metric-grid mt-4">
            <div className="metric-card">
              <p>Qualified leads</p>
              <strong>{dash.qualifiedLeads.value}</strong>
              <small>{dash.qualifiedLeads.changeLabel}</small>
            </div>
            <div className="metric-card">
              <p>Average order value</p>
              <strong>{formatNaira(dash.aov.value)}</strong>
              <small>{dash.aov.changeLabel}</small>
            </div>
            <div className="metric-card">
              <p>Conversion rate</p>
              <strong>{dash.conversionRate.value}%</strong>
              <small>{dash.conversionRate.changeLabel}</small>
            </div>
          </div>
          <div className="admin-grid">
            <section className="panel">
              <div className="panel-head">
                <h2>Revenue trend</h2>
                <span>{dash.dataSource === "live" ? "Verified payments" : "Sample"}</span>
              </div>
              <AdminAccessibleChart title="Revenue trend" series={dash.revenueChart} />
            </section>
            <section className="panel">
              <div className="panel-head">
                <h2>AI activity</h2>
              </div>
              {dash.aiActivity.length === 0 ? (
                <EmptyState
                  title="No AI activity"
                  copy="Assistant metrics will appear when connected."
                />
              ) : (
                <ul className="text-sm space-y-2">
                  {dash.aiActivity.map((a) => (
                    <li key={a.label} className="flex justify-between">
                      <span>{a.label}</span>
                      <strong>{a.count}</strong>
                    </li>
                  ))}
                </ul>
              )}
              <div className="panel-head mt-6">
                <h2>Automation activity</h2>
              </div>
              <ul className="text-sm space-y-2">
                {dash.automationActivity.map((a) => (
                  <li key={a.label} className="flex justify-between">
                    <span>{a.label}</span>
                    <strong>{a.count}</strong>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <div className="admin-grid">
            <section className="panel overflow-x-auto">
              <div className="panel-head">
                <h2>Recent orders</h2>
                <Link href="/admin/orders">View all</Link>
              </div>
              {dash.recentOrders.length === 0 ? (
                <EmptyState title="No orders yet" copy="Orders from checkout will appear here." />
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dash.recentOrders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <Link href={`/admin/orders/${o.id}`}>{o.id}</Link>
                        </td>
                        <td>{o.customerName}</td>
                        <td>{formatNaira(o.total)}</td>
                        <td>
                          <Status tone={o.paymentStatus === "paid" ? "success" : "warning"}>
                            {o.status}
                          </Status>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
            <section className="panel overflow-x-auto">
              <div className="panel-head">
                <h2>Recent leads</h2>
                <Link href="/admin/leads">View pipeline</Link>
              </div>
              {dash.recentLeads.length === 0 ? (
                <EmptyState title="No leads" copy="Lead capture funnels will populate this list." />
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Source</th>
                      <th>Stage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dash.recentLeads.map((l) => (
                      <tr key={l.id}>
                        <td>
                          <Link href={`/admin/leads/${l.id}`}>{l.name}</Link>
                        </td>
                        <td>{l.source}</td>
                        <td>{l.stage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
          <section className="panel mt-4 overflow-x-auto">
            <div className="panel-head">
              <h2>Product performance</h2>
              <span>Mock units sold</span>
            </div>
            {dash.productPerformance.length === 0 ? (
              <EmptyState
                title="No product data"
                copy="Connect catalog analytics for performance."
              />
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Units</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {dash.productPerformance.map((p) => (
                    <tr key={p.productId}>
                      <td>{p.name}</td>
                      <td>{p.units}</td>
                      <td>{formatNaira(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      ) : null}
    </AdminQueryState>
  );
}

export function AdminDashboardPanel() {
  return (
    <>
      <Suspense fallback={null}>
        <div className="mb-4">
          <AdminDateRangeFilter />
        </div>
      </Suspense>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <DashboardContent />
      </Suspense>
    </>
  );
}
