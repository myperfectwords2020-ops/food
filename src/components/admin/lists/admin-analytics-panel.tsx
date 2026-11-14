"use client";

import { Suspense } from "react";

import { AdminAccessibleChart } from "@/components/admin/admin-accessible-chart";
import { AdminAnalyticsExport } from "@/components/admin/admin-analytics-export";
import { AdminDateRangeFilter } from "@/components/admin/admin-date-range-filter";
import { AdminMockBanner } from "@/components/admin/admin-mock-banner";
import { AdminQueryState } from "@/components/admin/lists/admin-query-state";
import { EmptyState } from "@/components/page-ui";
import { useAdminAnalyticsQuery } from "@/hooks/queries/admin/use-admin-analytics";
import { formatNaira } from "@/lib/format";

function AnalyticsContent() {
  const { data: a, isLoading, isError, error } = useAdminAnalyticsQuery();

  const leadChartSeries =
    a?.leadSources.map((s) => ({ label: s.source.slice(0, 12), value: s.count })) ?? [];
  const revenueChartSeries =
    a?.revenueTrend?.map((p) => ({ label: p.label.slice(5), value: p.value })) ?? [];

  return (
    <AdminQueryState
      isLoading={isLoading}
      isError={isError}
      errorMessage={error instanceof Error ? error.message : undefined}
    >
      {a ? (
        <>
          <p className="text-sm text-muted-foreground mb-4">{a.rangeLabel}</p>
          {a.dataSource === "mock" ? <AdminMockBanner /> : null}
          {a.comparisons ? (
            <p className="text-xs text-muted-foreground mb-4">
              {a.comparisons.revenue} · {a.comparisons.orders} · {a.comparisons.leads}
              {a.comparisons.newCustomers ? ` · New customers: ${a.comparisons.newCustomers}` : ""}
            </p>
          ) : null}
          {a.refundMetrics ? (
            <div className="metric-grid mb-4">
              <div className="metric-card">
                <p>Refunds (NGN)</p>
                <strong>{formatNaira(a.refundMetrics.refundTotalNgn)}</strong>
              </div>
              <div className="metric-card">
                <p>Net revenue (NGN)</p>
                <strong>{formatNaira(a.refundMetrics.netRevenueNgn)}</strong>
              </div>
              <div className="metric-card">
                <p>Refunded orders</p>
                <strong>{a.refundMetrics.refundCount}</strong>
              </div>
            </div>
          ) : null}
          <section aria-labelledby="revenue-heading">
            <h2 id="revenue-heading" className="text-sm font-bold mb-3">
              Revenue
            </h2>
            <div className="metric-grid">
              <div className="metric-card">
                <p>Verified paid revenue (NGN)</p>
                <strong>{formatNaira(a.revenue)}</strong>
              </div>
              <div className="metric-card">
                <p>Paid orders</p>
                <strong>{a.orders}</strong>
              </div>
              <div className="metric-card">
                <p>AOV</p>
                <strong>{formatNaira(a.aov)}</strong>
              </div>
            </div>
            {revenueChartSeries.length > 0 ? (
              <div className="panel mt-4">
                <AdminAccessibleChart title="Revenue by day" series={revenueChartSeries} />
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState
                  title="No paid revenue in range"
                  copy="Completed Paystack payments appear after verification."
                />
              </div>
            )}
          </section>
          {a.orderAnalytics ? (
            <section className="mt-6" aria-labelledby="orders-heading">
              <h2 id="orders-heading" className="text-sm font-bold mb-3">
                Orders
              </h2>
              <div className="metric-grid">
                <div className="metric-card">
                  <p>Payment success rate</p>
                  <strong>{a.orderAnalytics.paymentSuccessRate}%</strong>
                </div>
                <div className="metric-card">
                  <p>Cancellation rate</p>
                  <strong>{a.orderAnalytics.cancellationRate}%</strong>
                </div>
              </div>
              <div className="panel mt-4 overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Orders created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {a.orderAnalytics.ordersByStatus.map((row) => (
                      <tr key={row.status}>
                        <td>{row.status.replaceAll("_", " ")}</td>
                        <td>{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
          <section className="mt-6" aria-labelledby="customers-heading">
            <h2 id="customers-heading" className="text-sm font-bold mb-3">
              Customers
            </h2>
            <div className="metric-grid">
              <div className="metric-card">
                <p>Total customers</p>
                <strong>{a.customers}</strong>
              </div>
              <div className="metric-card">
                <p>New customers</p>
                <strong>{a.newCustomers}</strong>
              </div>
              <div className="metric-card">
                <p>Returning</p>
                <strong>{a.returningCustomers}</strong>
              </div>
              <div className="metric-card">
                <p>Repeat purchases</p>
                <strong>{a.repeatPurchases}</strong>
              </div>
            </div>
          </section>
          <section className="mt-6 admin-grid">
            <div className="panel">
              <h2 className="text-sm font-bold mb-3">Leads</h2>
              <p className="text-sm">
                Leads: {a.leads} · Qualified: {a.qualifiedLeads} · Conversion: {a.conversionRate}%
              </p>
              {leadChartSeries.length === 0 ? (
                <EmptyState title="No leads in range" copy="Lead sources appear as CRM captures grow." />
              ) : (
                <AdminAccessibleChart title="Lead sources" series={leadChartSeries} />
              )}
            </div>
            <div className="panel overflow-x-auto">
              <h2 className="text-sm font-bold mb-3">Customer lifecycle</h2>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Stage</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {a.leadConversionFunnel.map((f) => (
                    <tr key={f.stage}>
                      <td>{f.stage.replaceAll("_", " ")}</td>
                      <td>{f.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="panel mt-6 overflow-x-auto" aria-labelledby="products-heading">
            <h2 id="products-heading" className="text-sm font-bold mb-3">
              Product engagement
            </h2>
            {a.productEngagement.length === 0 ? (
              <EmptyState
                title="No engagement data"
                copy="Views and cart events appear as customers browse products."
              />
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Views</th>
                    <th>Add to cart</th>
                    <th>Purchases</th>
                    <th>Conv. %</th>
                  </tr>
                </thead>
                <tbody>
                  {a.productEngagement.map((p) => (
                    <tr key={p.name}>
                      <td>{p.name}</td>
                      <td>{p.views}</td>
                      <td>{p.addToCart}</td>
                      <td>{p.purchases}</td>
                      <td>{p.conversionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {a.inventorySummary ? (
              <p className="text-xs text-muted-foreground mt-3">
                Inventory: {a.inventorySummary.lowStock} low stock · {a.inventorySummary.outOfStock}{" "}
                out of stock
              </p>
            ) : null}
          </section>
          <section className="admin-grid mt-6">
            <div className="panel">
              <h2 className="text-sm font-bold mb-3">AI assistant</h2>
              <ul className="text-sm space-y-2">
                <li>Conversations: {a.aiMetrics.conversations}</li>
                <li>Customer messages: {a.aiMetrics.customerMessages ?? 0}</li>
                <li>AI responses: {a.aiMetrics.aiResponses ?? 0}</li>
                <li>Handoffs: {a.aiMetrics.handoffRequests ?? 0}</li>
                <li>Recommendations saved: {a.aiMetrics.recommendations}</li>
                <li>Recommendation clicks: {a.aiMetrics.recommendationClicks}</li>
                <li>Assistant-attributed orders: {a.aiMetrics.assistedConversions}</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                Counts use stored assistant conversations only; attribution metrics are not tracked.
              </p>
            </div>
            <div className="panel overflow-x-auto">
              <h2 className="text-sm font-bold mb-3">Automation runs</h2>
              {a.automationPerformance.length === 0 ? (
                <EmptyState title="No automation runs" copy="Runs appear when automations execute." />
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Runs</th>
                      <th>Success</th>
                      <th>Failures</th>
                    </tr>
                  </thead>
                  <tbody>
                    {a.automationPerformance.map((row) => (
                      <tr key={row.name}>
                        <td>{row.name}</td>
                        <td>{row.runs}</td>
                        <td>{row.successRate}%</td>
                        <td>{row.failures}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
          {a.conversationMetrics ? (
            <section className="panel mt-6 overflow-x-auto">
              <h2 className="text-sm font-bold mb-3">Conversations</h2>
              <p className="text-sm mb-2">
                Open backlog: {a.conversationMetrics.unresolvedBacklog} · Human assigned in
                period: {a.conversationMetrics.humanAssigned}
              </p>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {a.conversationMetrics.byStatus.map((row) => (
                    <tr key={row.status}>
                      <td>{row.status.replaceAll("_", " ")}</td>
                      <td>{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}
          {a.notificationMetrics ? (
            <section className="panel mt-6">
              <h2 className="text-sm font-bold mb-3">Notifications (excl. in-app)</h2>
              <div className="metric-grid">
                <div className="metric-card">
                  <p>Sent</p>
                  <strong>{a.notificationMetrics.sent}</strong>
                </div>
                <div className="metric-card">
                  <p>Delivered</p>
                  <strong>{a.notificationMetrics.delivered}</strong>
                </div>
                <div className="metric-card">
                  <p>Failed</p>
                  <strong>{a.notificationMetrics.failed}</strong>
                </div>
                <div className="metric-card">
                  <p>Delivery rate</p>
                  <strong>{a.notificationMetrics.deliveryRate}%</strong>
                </div>
              </div>
            </section>
          ) : null}
          {a.unavailableMetrics && a.unavailableMetrics.length > 0 ? (
            <p className="text-xs text-muted-foreground mt-6" role="note">
              {a.unavailableMetrics.join(" ")}
            </p>
          ) : null}
        </>
      ) : null}
    </AdminQueryState>
  );
}

export function AdminAnalyticsPanel() {
  return (
    <>
      <Suspense fallback={null}>
        <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
          <AdminDateRangeFilter />
          <AdminAnalyticsExport />
        </div>
      </Suspense>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <AnalyticsContent />
      </Suspense>
    </>
  );
}
