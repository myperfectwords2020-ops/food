import { adminRangeLabel } from "@/lib/admin-constants";
import {
  legacyOrderRows,
  seedAdminProducts,
  seedAutomations,
  seedConversations,
  seedCustomers,
  seedInventoryTransactions,
  seedLeads,
  seedSettings,
} from "@/lib/admin-mock-data";
import { paginateAdminList } from "@/lib/admin-list-utils";
import { mockOrderService } from "@/services/order.service";
import type {
  AdminAutomation,
  AdminConversation,
  AdminConversationFilters,
  AdminCustomer,
  AdminCustomerDetail,
  AdminCustomerFilters,
  AdminDateRange,
  AdminLead,
  AdminLeadFilters,
  AdminOrderDetail,
  AdminOrderFilters,
  AdminOrderListItem,
  AdminProduct,
  AdminProductFilters,
  AdminSettings,
  AiAdminOverview,
  AnalyticsSnapshot,
  DashboardMetrics,
  InventoryTransaction,
  WorkflowNode,
} from "@/types/admin";
import type { OrderStatus } from "@/types/commerce";

import type { AdminService } from "./admin.service";

let productStore = seedAdminProducts();
let inventoryTx = seedInventoryTransactions(productStore);
let automationStore = seedAutomations();
const settingsStore = seedSettings();

function legacyStatus(status: string): OrderStatus {
  if (status === "Delivered") return "delivered";
  if (status === "Shipped") return "shipped";
  if (status === "Awaiting") return "pending_payment";
  return "processing";
}

async function listAllOrders(): Promise<AdminOrderListItem[]> {
  const dynamic = await mockOrderService.listOrdersForAccount();
  const dynamicRows: AdminOrderListItem[] = dynamic.map((o) => ({
    id: o.id,
    customerName: `${o.customer.firstName} ${o.customer.lastName}`,
    customerEmail: o.customer.email,
    itemCount: o.lines.reduce((s, l) => s + l.quantity, 0),
    total: o.summary.total,
    status: o.status,
    paymentStatus: o.paymentStatus,
    createdAt: o.createdAt,
    displayDate: new Date(o.createdAt).toLocaleString("en-NG"),
  }));

  const legacyRows: AdminOrderListItem[] = legacyOrderRows.map((o) => ({
    id: o.id,
    customerName: o.customer,
    customerEmail: "customer@example.com",
    itemCount: o.items,
    total: o.amount,
    status: legacyStatus(o.status),
    paymentStatus: o.payment === "Paid" ? "paid" : "pending",
    createdAt: "2026-03-06T08:00:00Z",
    displayDate: o.date,
  }));

  return [...dynamicRows, ...legacyRows];
}

function filterOrders(items: AdminOrderListItem[], filters?: AdminOrderFilters) {
  let result = items;
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    result = result.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q),
    );
  }
  if (filters?.status) result = result.filter((o) => o.status === filters.status);
  if (filters?.paymentStatus)
    result = result.filter((o) => o.paymentStatus === filters.paymentStatus);
  return result;
}

async function enrichCustomer(
  customer: AdminCustomer,
  orders: AdminOrderListItem[],
): Promise<AdminCustomerDetail> {
  return {
    ...customer,
    skinProfile: "Combination skin · hydration & barrier support · fragrance-free preferred",
    activityTimeline: [
      { id: "act-1", label: "Last storefront visit", at: "2026-03-06T08:00:00Z" },
      { id: "act-2", label: "Routine consultation completed", at: "2026-02-18T11:00:00Z" },
    ],
    orderHistory: orders.filter((o) => o.customerEmail === customer.email).slice(0, 8),
    conversationIds: seedConversations()
      .filter((c) => c.customerEmail === customer.email)
      .map((c) => c.id),
  };
}

function filterConversations(
  items: Omit<AdminConversation, "messages">[],
  filters?: AdminConversationFilters,
) {
  let result = items;
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    result = result.filter(
      (c) =>
        c.customerName.toLowerCase().includes(q) ||
        c.customerEmail.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q),
    );
  }
  if (filters?.status) result = result.filter((c) => c.status === filters.status);
  if (filters?.channel) result = result.filter((c) => c.channel === filters.channel);
  return result;
}

export const mockAdminService: AdminService = {
  async getDashboard(
    _ctx: import("@/lib/auth/types").RequestContext,
    range?: AdminDateRange,
  ): Promise<DashboardMetrics> {
    const resolved = range ?? "30d";
    const allOrders = await listAllOrders();
    const revenue = allOrders.reduce((s, o) => s + (o.paymentStatus === "paid" ? o.total : 0), 0);
    const customers = seedCustomers();
    const leadList = seedLeads();
    const qualified = leadList.filter(
      (l) => l.stage === "QUALIFIED" || l.stage === "CUSTOMER",
    ).length;
    const paidOrders = allOrders.filter((o) => o.paymentStatus === "paid").length;
    const aov = paidOrders ? Math.round(revenue / paidOrders) : 0;
    const windowLabel = adminRangeLabel(resolved);

    return {
      dataSource: "mock",
      range: resolved,
      rangeLabel: windowLabel,
      revenue: { value: revenue, changeLabel: `${windowLabel} · mock aggregate` },
      orders: { value: allOrders.length, changeLabel: "Sample + checkout orders" },
      customers: { value: customers.length, changeLabel: "CRM mock data" },
      newCustomers: { value: 2, changeLabel: "Mock new in period" },
      leads: { value: leadList.length, changeLabel: "Active pipeline" },
      qualifiedLeads: { value: qualified, changeLabel: "Qualified + converted stages" },
      aov: { value: aov, changeLabel: "Based on paid mock orders only" },
      conversionRate: {
        value: 18.5,
        changeLabel: "Illustrative · verify on backend",
      },
      revenueChart: [
        { label: "Mon", value: 42 },
        { label: "Tue", value: 58 },
        { label: "Wed", value: 51 },
        { label: "Thu", value: 67 },
        { label: "Fri", value: 72 },
        { label: "Sat", value: 88 },
        { label: "Sun", value: 64 },
      ],
      productPerformance: productStore.slice(0, 5).map((p, i) => ({
        productId: p.id,
        name: p.name,
        units: 12 - i,
        revenue: p.price * (12 - i),
      })),
      recentOrders: allOrders.slice(0, 5),
      recentLeads: leadList.slice(0, 4),
      aiActivity: [
        { label: "Conversations today", count: 24 },
        { label: "Recommendations sent", count: 41 },
        { label: "Handoffs", count: 3 },
      ],
      automationActivity: [
        { label: "Runs today", count: 18 },
        { label: "Success", count: 17 },
        { label: "Failed", count: 1 },
      ],
    };
  },

  async listOrders(filters) {
    const filtered = filterOrders(await listAllOrders(), filters);
    return paginateAdminList(filtered, filters?.page ?? 1, filters?.pageSize ?? 10);
  },

  async getOrder(id) {
    const full = await mockOrderService.getOrder(id);
    if (!full) return null;
    const list = await listAllOrders();
    const row = list.find((o) => o.id === id);
    const detail: AdminOrderDetail = {
      ...full,
      customerName: row?.customerName ?? `${full.customer.firstName} ${full.customer.lastName}`,
      paymentReference: full.paymentStatus === "paid" ? `PSK-MOCK-${id}` : undefined,
      timeline: [
        { id: "1", label: "Order placed", at: full.createdAt },
        {
          id: "2",
          label: full.paymentStatus === "paid" ? "Payment confirmed" : "Awaiting payment",
          at: full.createdAt,
          detail: "Verified server-side when Paystack is connected",
        },
        {
          id: "3",
          label: "Fulfillment",
          at: full.createdAt,
          detail: full.deliveryEstimate,
        },
      ],
    };
    return detail;
  },

  async listProducts(filters) {
    let items = [...productStore];
    if (filters?.q) {
      const q = filters.q.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      );
    }
    if (filters?.status) items = items.filter((p) => p.status === filters.status);
    if (filters?.category) items = items.filter((p) => p.category === filters.category);
    return items;
  },

  async getProduct(id) {
    return productStore.find((p) => p.id === id || p.slug === id) ?? null;
  },

  async createProduct(input) {
    const id = `p-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const product: AdminProduct = { ...input, id, createdAt: now, updatedAt: now };
    productStore = [...productStore, product];
    return product;
  },

  async updateProduct(id, input) {
    const idx = productStore.findIndex((p) => p.id === id);
    if (idx < 0) return null;
    const updated = {
      ...productStore[idx]!,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    productStore = productStore.map((p) => (p.id === id ? updated : p));
    return updated;
  },

  async archiveProduct(id) {
    const p = await mockAdminService.updateProduct(id, { status: "archived" });
    return Boolean(p);
  },

  async listInventory() {
    return productStore.map((product) => ({
      product,
      lowStock: product.stock > 0 && product.stock <= 10,
      outOfStock: product.stock <= 0,
    }));
  },

  async listInventoryTransactions(productId) {
    if (productId) return inventoryTx.filter((t) => t.productId === productId);
    return inventoryTx;
  },

  async adjustStock(productId, delta, note, actor) {
    const idx = productStore.findIndex((p) => p.id === productId);
    if (idx < 0) return null;
    const p = productStore[idx]!;
    const stock = Math.max(0, p.stock + delta);
    productStore = productStore.map((x) => (x.id === productId ? { ...x, stock } : x));
    const tx: InventoryTransaction = {
      id: `inv-${crypto.randomUUID().slice(0, 8)}`,
      productId,
      productName: p.name,
      type: "adjustment",
      delta,
      balanceAfter: stock,
      note,
      createdAt: new Date().toISOString(),
      actor,
    };
    inventoryTx = [tx, ...inventoryTx];
    return productStore.find((x) => x.id === productId) ?? null;
  },

  async listCustomers(filters) {
    const orders = await listAllOrders();
    const base = filterCustomers(seedCustomers(), filters);
    return Promise.all(base.map((c) => enrichCustomer(c, orders)));
  },

  async getCustomer(id) {
    const customer = seedCustomers().find((c) => c.id === id);
    if (!customer) return null;
    return enrichCustomer(customer, await listAllOrders());
  },

  async listLeads(filters) {
    const filtered = filterLeads(seedLeads(), filters);
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;
    return paginateAdminList(filtered, page, pageSize);
  },

  async getLead(id) {
    return seedLeads().find((l) => l.id === id) ?? null;
  },

  async listConversations(filters, page = 1, pageSize = 10) {
    const rows = seedConversations().map(({ messages: _m, ...rest }) => rest);
    const filtered = filterConversations(rows, filters);
    return paginateAdminList(filtered, page, pageSize);
  },

  async getConversation(id) {
    return seedConversations().find((c) => c.id === id) ?? null;
  },

  async getAiOverview(): Promise<AiAdminOverview> {
    return {
      conversationCount: 156,
      recommendationCount: 412,
      recommendationPerformance: productStore.slice(0, 4).map((p, i) => ({
        productName: p.name,
        recommendations: 40 - i * 5,
        clicks: 18 - i * 3,
      })),
      handoffCount: 9,
      failedCount: 6,
      recentConversations: seedConversations().map((c) => ({
        id: c.id,
        customer: c.customerName,
        preview: c.messages[c.messages.length - 1]?.body.slice(0, 80) ?? "",
        at: c.lastMessageAt,
      })),
      toolActivity: [
        { tool: "catalog.search", calls: 890, lastUsed: "2026-03-06T14:00:00Z" },
        { tool: "order.status_lookup", calls: 42, lastUsed: "2026-03-06T11:00:00Z" },
      ],
      config: {
        modelLabel: "Configured on server (not shown in UI)",
        handoffEnabled: true,
        catalogSearchEnabled: true,
        orderLookupEnabled: true,
      },
      failedInteractions: [
        { id: "fail-1", reason: "Rate limit (mock)", at: "2026-03-05T18:00:00Z" },
        { id: "fail-2", reason: "Empty model response", at: "2026-03-04T09:00:00Z" },
      ],
    };
  },

  async listAutomations() {
    return automationStore.map(({ nodes: _n, runs: _r, ...rest }) => rest);
  },

  async getAutomation(id) {
    return automationStore.find((a) => a.id === id) ?? null;
  },

  async createAutomation(input) {
    const auto: AdminAutomation = {
      id: `auto-${crypto.randomUUID().slice(0, 8)}`,
      name: input.name,
      description: input.description,
      status: "draft",
      trigger: input.trigger,
      actionsSummary: input.nodes.map((n) => n.type).join(" · "),
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
      nodes: input.nodes,
      runs: [],
    };
    automationStore = [...automationStore, auto];
    return auto;
  },

  async updateAutomation(id, input) {
    const idx = automationStore.findIndex((a) => a.id === id);
    if (idx < 0) return null;
    const current = automationStore[idx]!;
    const updated: AdminAutomation = {
      ...current,
      ...input,
      actionsSummary: input.nodes?.map((n) => n.type).join(" · ") ?? current.actionsSummary,
    };
    automationStore = automationStore.map((a) => (a.id === id ? updated : a));
    return updated;
  },

  async setAutomationEnabled(id, enabled) {
    const a = await mockAdminService.updateAutomation(id, {
      status: enabled ? "enabled" : "disabled",
    });
    return Boolean(a);
  },

  async publishAutomation(id) {
    await mockAdminService.updateAutomation(id, { status: "enabled" });
    await mockAdminService.setAutomationEnabled(id, true);
  },

  async getAnalytics(
    ctx: import("@/lib/auth/types").RequestContext,
    range?: AdminDateRange,
  ): Promise<AnalyticsSnapshot> {
    const resolved = range ?? "30d";
    const dash = await mockAdminService.getDashboard(ctx, resolved);
    return {
      dataSource: "mock",
      range: resolved,
      rangeLabel: dash.rangeLabel,
      revenue: dash.revenue.value,
      orders: dash.orders.value,
      aov: dash.aov.value,
      customers: dash.customers.value,
      newCustomers: 2,
      returningCustomers: 1,
      repeatPurchases: 3,
      leads: dash.leads.value,
      qualifiedLeads: dash.qualifiedLeads.value,
      conversionRate: dash.conversionRate.value,
      repeatCustomers: 1,
      leadSources: [
        { source: "Routine quiz", count: 12 },
        { source: "AI assistant", count: 18 },
        { source: "Newsletter", count: 8 },
        { source: "Instagram", count: 15 },
      ],
      leadConversionFunnel: [
        { stage: "VISITOR", count: 1200 },
        { stage: "LEAD", count: 180 },
        { stage: "QUALIFIED", count: 42 },
        { stage: "CUSTOMER", count: 28 },
        { stage: "REPEAT_CUSTOMER", count: 9 },
      ],
      productPerformance: dash.productPerformance.map((p) => ({
        name: p.name,
        revenue: p.revenue,
        units: p.units,
      })),
      productEngagement: dash.productPerformance.map((p, i) => ({
        name: p.name,
        views: 120 - i * 15,
        addToCart: 24 - i * 3,
        purchases: p.units,
        conversionRate: Math.max(5, 20 - i * 2),
      })),
      aiMetrics: {
        conversations: 156,
        recommendations: 412,
        recommendationClicks: 89,
        assistedConversions: 14,
      },
      aiAssistedConversions: 14,
      automationPerformance: automationStore.map((a) => ({
        name: a.name,
        successRate: a.executionCount ? Math.round((a.successCount / a.executionCount) * 100) : 0,
        runs: a.executionCount,
        failures: a.failureCount,
        drivenConversions: Math.floor(a.successCount / 10),
      })),
    };
  },

  async getSettings() {
    return settingsStore;
  },
};

function filterCustomers(items: AdminCustomer[], filters?: AdminCustomerFilters) {
  let result = items;
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q),
    );
  }
  if (filters?.lifecycle) result = result.filter((c) => c.lifecycle === filters.lifecycle);
  return result;
}

function filterLeads(items: AdminLead[], filters?: AdminLeadFilters) {
  let result = items;
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    result = result.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.source.toLowerCase().includes(q),
    );
  }
  if (filters?.stage) result = result.filter((l) => l.stage === filters.stage);
  if (filters?.status) result = result.filter((l) => l.status === filters.status);
  if (filters?.source) result = result.filter((l) => l.source === filters.source);
  return result;
}
