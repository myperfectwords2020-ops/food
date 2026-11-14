import type { RequestContext } from "@/lib/auth/types";
import { authorize } from "@/lib/auth/authorize-context";
import { requireTenantId } from "@/lib/db/tenant-query";
import { prisma } from "@/lib/db/prisma";
import {
  formatComparisonLabel,
  parseAnalyticsPreset,
  resolveAnalyticsRange,
} from "@/modules/analytics/analytics-filters";
import { getAnalyticsSnapshot } from "@/modules/analytics/analytics-orchestrator.service";
import { getLeadAnalytics } from "@/modules/analytics/lead-analytics.service";
import {
  getRevenueMetrics,
  getRevenueMetricsForWindow,
} from "@/modules/analytics/revenue-analytics.service";
import { getCustomerAnalytics } from "@/modules/analytics/customer-analytics.service";
import { getProductAnalytics } from "@/modules/analytics/product-analytics.service";
import { getAIAnalytics } from "@/modules/analytics/ai-analytics.service";
import { getAutomationAnalytics } from "@/modules/analytics/automation-analytics.service";
import { listAdminOrders } from "@/modules/orders/admin-order.service";
import { listAdminLeads } from "@/modules/leads/admin-lead.service";
import type { AdminDateRange, AnalyticsSnapshot, DashboardMetrics } from "@/types/admin";

export async function getLiveAnalytics(
  ctx: RequestContext,
  range?: AdminDateRange,
): Promise<AnalyticsSnapshot> {
  return getAnalyticsSnapshot(ctx, range);
}

export async function getLiveDashboard(
  ctx: RequestContext,
  range?: AdminDateRange,
): Promise<DashboardMetrics> {
  authorize(ctx, "analytics.read");
  const tenantId = requireTenantId(ctx.tenantId, ctx.role);
  const preset = parseAnalyticsPreset(range);
  const resolved = resolveAnalyticsRange(preset);

  const [
    revenue,
    priorRevenue,
    customers,
    priorNewCustomers,
    cumulativeEnd,
    cumulativePriorEnd,
    leads,
    priorLeadCount,
    products,
    ai,
    automations,
  ] = await Promise.all([
    getRevenueMetrics(tenantId, resolved),
    getRevenueMetricsForWindow(tenantId, resolved.priorStart, resolved.priorEnd),
    getCustomerAnalytics(tenantId, resolved),
    prisma.customer.count({
      where: {
        tenantId,
        createdAt: { gte: resolved.priorStart, lt: resolved.priorEnd },
      },
    }),
    prisma.customer.count({
      where: { tenantId, createdAt: { lt: resolved.end } },
    }),
    prisma.customer.count({
      where: { tenantId, createdAt: { lt: resolved.priorEnd } },
    }),
    getLeadAnalytics(tenantId, resolved),
    prisma.lead.count({
      where: {
        tenantId,
        createdAt: { gte: resolved.priorStart, lt: resolved.priorEnd },
      },
    }),
    getProductAnalytics(tenantId, resolved),
    getAIAnalytics(tenantId, resolved),
    getAutomationAnalytics(tenantId, resolved),
  ]);

  const [recentOrders, recentLeads] = await Promise.all([
    listAdminOrders(ctx, { page: 1, pageSize: 5 }),
    listAdminLeads(ctx, { page: 1, pageSize: 5 }),
  ]);

  return {
    dataSource: "live",
    range: preset,
    rangeLabel: `${resolved.label} · verified payments · UTC`,
    revenue: {
      value: revenue.paidRevenue,
      changeLabel: formatComparisonLabel(revenue.paidRevenue, priorRevenue.paidRevenue),
    },
    orders: {
      value: revenue.paidOrderCount,
      changeLabel: formatComparisonLabel(revenue.paidOrderCount, priorRevenue.paidOrderCount),
    },
    customers: {
      value: customers.totalCustomers,
      changeLabel: `All time · cumulative ${formatComparisonLabel(cumulativeEnd, cumulativePriorEnd)}`,
    },
    newCustomers: {
      value: customers.newCustomers,
      changeLabel: formatComparisonLabel(customers.newCustomers, priorNewCustomers),
    },
    leads: {
      value: leads.leadsCreated,
      changeLabel: formatComparisonLabel(leads.leadsCreated, priorLeadCount),
    },
    qualifiedLeads: {
      value: leads.qualifiedLeads,
      changeLabel: "In selected period",
    },
    aov: {
      value: revenue.averageOrderValue,
      changeLabel: "Paid orders only",
    },
    conversionRate: {
      value: leads.conversionRate,
      changeLabel: "Converted ÷ leads created in period",
    },
    revenueChart: revenue.revenueTrend.map((p) => ({ label: p.label, value: p.value })),
    productPerformance: products.topProducts.map((p) => ({
      productId: p.productId ?? p.name,
      name: p.name,
      units: p.units,
      revenue: p.revenue,
    })),
    recentOrders: recentOrders.items,
    recentLeads: recentLeads.items,
    aiActivity: [
      { label: "AI conversations", count: ai.conversationsStarted },
      { label: "Customer messages", count: ai.customerMessages },
      { label: "AI responses", count: ai.aiResponses },
      { label: "Handoffs", count: ai.handoffRequests },
    ],
    automationActivity: automations.automationPerformance.slice(0, 5).map((a) => ({
      label: a.name,
      count: a.runs,
    })),
  };
}
