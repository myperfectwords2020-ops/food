"use server";

import { authorize } from "@/lib/auth/authorize-context";
import { requireRequestContext } from "@/lib/auth/request-context";
import { logger } from "@/lib/logger/logger";
import { buildAnalyticsCsv } from "@/modules/analytics/analytics-csv-export.service";
import { getAnalyticsSnapshot } from "@/modules/analytics/analytics-orchestrator.service";
import { listAdminCustomers } from "@/modules/customers/admin-customer.service";
import { listAdminOrders } from "@/modules/orders/admin-order.service";
import {
  listAdminInventory,
  listAdminInventoryTransactions,
  listAdminProducts,
} from "@/modules/products/admin-product.service";
import { adminService } from "@/services/index";
import type {
  AdminCustomerFilters,
  AdminDateRange,
  AdminLeadFilters,
  AdminOrderFilters,
  AdminProductFilters,
} from "@/types/admin";

export async function fetchAdminOrdersAction(filters: AdminOrderFilters) {
  const ctx = await requireRequestContext();
  return listAdminOrders(ctx, filters);
}

export async function fetchAdminProductsAction(filters?: AdminProductFilters) {
  const ctx = await requireRequestContext();
  return listAdminProducts(ctx, filters);
}

export async function fetchAdminCustomersAction(filters?: AdminCustomerFilters) {
  const ctx = await requireRequestContext();
  return listAdminCustomers(ctx, filters);
}

export async function fetchAdminInventoryAction() {
  const ctx = await requireRequestContext();
  const [rows, transactions] = await Promise.all([
    listAdminInventory(ctx),
    listAdminInventoryTransactions(ctx),
  ]);
  return { rows, transactions };
}

export async function fetchAdminDashboardAction(range: AdminDateRange) {
  const ctx = await requireRequestContext();
  return adminService.getDashboard(ctx, range);
}

export async function fetchAdminAnalyticsAction(range: AdminDateRange) {
  const ctx = await requireRequestContext();
  return adminService.getAnalytics(ctx, range);
}

export async function exportAdminAnalyticsCsvAction(range: AdminDateRange) {
  const ctx = await requireRequestContext();
  authorize(ctx, "analytics.read");
  try {
    const snapshot = await getAnalyticsSnapshot(ctx, range);
    const csv = buildAnalyticsCsv(snapshot);
    logger.info("analytics_export", { tenantId: ctx.tenantId ?? undefined, operation: range });
    return {
      ok: true as const,
      csv,
      filename: `elanskin-analytics-${range}-${new Date().toISOString().slice(0, 10)}.csv`,
    };
  } catch (error) {
    logger.error("analytics_export_failed", { tenantId: ctx.tenantId ?? undefined }, { error });
    return { ok: false as const, error: "Could not export analytics." };
  }
}

export async function fetchAdminLeadsAction(filters?: AdminLeadFilters) {
  await requireRequestContext();
  return adminService.listLeads(filters);
}
