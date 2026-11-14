import type { RequestContext } from "@/lib/auth/types";
import { authorize } from "@/lib/auth/authorize-context";
import { requireTenantId } from "@/lib/db/tenant-query";
import { logger } from "@/lib/logger/logger";
import {
  formatComparisonLabel,
  parseAnalyticsPreset,
  resolveAnalyticsRange,
} from "@/modules/analytics/analytics-filters";
import { getAIAnalytics } from "@/modules/analytics/ai-analytics.service";
import { getAutomationAnalytics } from "@/modules/analytics/automation-analytics.service";
import { getConversationAnalytics } from "@/modules/analytics/conversation-analytics.service";
import { getCustomerAnalytics } from "@/modules/analytics/customer-analytics.service";
import { getLeadAnalytics } from "@/modules/analytics/lead-analytics.service";
import { getNotificationAnalytics } from "@/modules/analytics/notification-analytics.service";
import { getOrderAnalytics } from "@/modules/analytics/order-analytics.service";
import { getProductAnalytics } from "@/modules/analytics/product-analytics.service";
import {
  buildProductEngagementRows,
  getAttributionMetrics,
} from "@/modules/analytics/engagement-analytics.service";
import {
  getRevenueMetrics,
  getRevenueMetricsForWindow,
} from "@/modules/analytics/revenue-analytics.service";
import { prisma } from "@/lib/db/prisma";
import type { AdminDateRange, AnalyticsSnapshot } from "@/types/admin";

export async function getAnalyticsSnapshot(
  ctx: RequestContext,
  rangeInput?: AdminDateRange,
): Promise<AnalyticsSnapshot> {
  authorize(ctx, "analytics.read");
  const tenantId = requireTenantId(ctx.tenantId, ctx.role);
  const preset = parseAnalyticsPreset(rangeInput);
  const range = resolveAnalyticsRange(preset);
  const started = Date.now();

  try {
    const [
      revenue,
      priorRevenue,
      orders,
      customers,
      leads,
      products,
      ai,
      conversations,
      automations,
      notifications,
    ] = await Promise.all([
      getRevenueMetrics(tenantId, range),
      getRevenueMetricsForWindow(tenantId, range.priorStart, range.priorEnd),
      getOrderAnalytics(tenantId, range),
      getCustomerAnalytics(tenantId, range),
      getLeadAnalytics(tenantId, range),
      getProductAnalytics(tenantId, range),
      getAIAnalytics(tenantId, range),
      getConversationAnalytics(tenantId, range),
      getAutomationAnalytics(tenantId, range),
      getNotificationAnalytics(tenantId, range),
    ]);

    const [
      priorLeads,
      priorNewCustomers,
      cumulativeEnd,
      cumulativePriorEnd,
      engagement,
      attribution,
    ] = await Promise.all([
      prisma.lead.count({
        where: {
          tenantId,
          createdAt: { gte: range.priorStart, lt: range.priorEnd },
        },
      }),
      prisma.customer.count({
        where: {
          tenantId,
          createdAt: { gte: range.priorStart, lt: range.priorEnd },
        },
      }),
      prisma.customer.count({
        where: { tenantId, createdAt: { lt: range.end } },
      }),
      prisma.customer.count({
        where: { tenantId, createdAt: { lt: range.priorEnd } },
      }),
      buildProductEngagementRows(tenantId, range, products.topProducts),
      getAttributionMetrics(tenantId, range),
    ]);

    const snapshot: AnalyticsSnapshot = {
      dataSource: "live",
      range: preset,
      rangeLabel: `${range.label} · UTC boundaries · ${ANALYTICS_TIMEZONE_NOTE}`,
      revenue: revenue.paidRevenue,
      orders: revenue.paidOrderCount,
      aov: revenue.averageOrderValue,
      customers: customers.totalCustomers,
      newCustomers: customers.newCustomers,
      returningCustomers: customers.returningCustomers,
      repeatPurchases: customers.repeatPurchases,
      leads: leads.leadsCreated,
      qualifiedLeads: leads.qualifiedLeads,
      conversionRate: leads.conversionRate,
      repeatCustomers: customers.returningCustomers,
      leadSources: leads.leadSources,
      leadConversionFunnel: leads.leadConversionFunnel,
      productPerformance: products.topProducts.map((p) => ({
        name: p.name,
        revenue: p.revenue,
        units: p.units,
      })),
      productEngagement: engagement.map((p) => ({
        name: p.name,
        views: p.views,
        addToCart: p.addToCart,
        purchases: p.purchases,
        conversionRate: p.conversionRate,
      })),
      aiMetrics: {
        conversations: ai.conversationsStarted,
        recommendations: ai.recommendations,
        recommendationClicks: attribution.recommendationClicks,
        assistedConversions: attribution.assistedOrders,
        handoffRequests: ai.handoffRequests,
        aiResponses: ai.aiResponses,
        customerMessages: ai.customerMessages,
      },
      aiAssistedConversions: attribution.assistedOrders,
      automationPerformance: automations.automationPerformance.map((row) => ({
        name: row.name,
        successRate: row.successRate,
        runs: row.runs,
        failures: row.failures,
        drivenConversions: 0,
      })),
      revenueTrend: revenue.revenueTrend,
      orderAnalytics: orders,
      conversationMetrics: conversations,
      notificationMetrics: notifications,
      inventorySummary: {
        lowStock: products.lowStockCount,
        outOfStock: products.outOfStockCount,
      },
      refundMetrics: {
        refundCount: revenue.refunds.refundCount,
        refundTotalNgn: revenue.refunds.refundTotalNgn,
        netRevenueNgn: revenue.refunds.netRevenueNgn,
      },
      comparisons: {
        revenue: formatComparisonLabel(revenue.paidRevenue, priorRevenue.paidRevenue),
        orders: formatComparisonLabel(revenue.paidOrderCount, priorRevenue.paidOrderCount),
        leads: formatComparisonLabel(leads.leadsCreated, priorLeads),
        newCustomers: formatComparisonLabel(customers.newCustomers, priorNewCustomers),
        customersCumulative: formatComparisonLabel(cumulativeEnd, cumulativePriorEnd),
      },
    };

    const elapsed = Date.now() - started;
    if (elapsed > 3000) {
      logger.warn("analytics_slow_report", { tenantId, operation: preset }, { elapsedMs: elapsed });
    }

    return snapshot;
  } catch (error) {
    logger.error("analytics_query_failed", { tenantId, operation: preset }, { error });
    throw error;
  }
}

const ANALYTICS_TIMEZONE_NOTE = "default TZ Africa/Lagos for labels only";
