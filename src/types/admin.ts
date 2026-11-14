import type { Order, OrderStatus } from "@/types/commerce";

export type LeadLifecycleStage = "VISITOR" | "LEAD" | "QUALIFIED" | "CUSTOMER" | "REPEAT_CUSTOMER";

export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "UNQUALIFIED" | "CONVERTED" | "LOST";

export type AdminProductStatus = "active" | "draft" | "archived";

export type AdminProductImage = {
  url: string;
  storageKey?: string | undefined;
};

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  images?: AdminProductImage[] | undefined;
  concern: string;
  skinTypes: string[];
  ingredients: string[];
  stock: number;
  status: AdminProductStatus;
  badge?: string | undefined;
  usageInstructions: string;
  warnings: string;
  recommendationNote?: string | undefined;
  relatedProductIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type InventoryTransactionType = "adjustment" | "sale" | "restock" | "return";

export type InventoryTransaction = {
  id: string;
  productId: string;
  productName: string;
  type: InventoryTransactionType;
  delta: number;
  balanceAfter: number;
  note: string;
  createdAt: string;
  actor: string;
};

export type AdminOrderListItem = {
  id: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: "pending" | "paid" | "failed";
  createdAt: string;
  displayDate: string;
};

export type OrderTimelineEvent = {
  id: string;
  label: string;
  at: string;
  detail?: string | undefined;
};

export type AdminOrderDetail = Order & {
  customerName: string;
  timeline: OrderTimelineEvent[];
  paymentReference?: string | undefined;
};

export type AdminCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  lifecycle: LeadLifecycleStage;
  ordersCount: number;
  totalSpent: number;
  lastActivity: string;
  leadId?: string | undefined;
  preferencesSummary: string;
  recommendationSlugs: string[];
};

export type AdminLead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  /** @deprecated Kanban uses `status` in production CRM. */
  stage: LeadLifecycleStage;
  status: LeadStatus;
  score: number;
  qualification: "unqualified" | "marketing_qualified" | "sales_qualified";
  owner: string;
  concern: string;
  interest: string;
  notes: string[];
  timeline: { id: string; label: string; at: string }[];
  interestedProductIds: string[];
  aiRecommendationSlugs: string[];
  followUpAt?: string | undefined;
  convertedCustomerId?: string | undefined;
  lastActivity: string;
};

export type ConversationChannel = "ai_assistant" | "whatsapp" | "email";
export type ConversationStatus =
  "active" | "handoff_requested" | "human_assigned" | "resolved" | "closed";

export type AdminConversationMessage = {
  id: string;
  role: "customer" | "ai" | "human" | "system" | "internal_note";
  body: string;
  at: string;
  recommendedProductSlugs?: string[] | undefined;
};

export type AdminConversation = {
  id: string;
  customerName: string;
  customerEmail: string;
  channel: ConversationChannel;
  status: ConversationStatus;
  subject: string;
  lastMessageAt: string;
  contextSummary: string;
  messages: AdminConversationMessage[];
  unreadStaffCount?: number | undefined;
  handoffRequested?: boolean | undefined;
  assignedToUserId?: string | undefined;
  assignedToName?: string | undefined;
  hasMoreMessages?: boolean | undefined;
  nextMessageCursor?: string | undefined;
  leadId?: string | undefined;
};

export type WorkflowNodeType =
  "TRIGGER" | "CONDITION" | "ACTION" | "DELAY" | "NOTIFICATION" | "END";

export type WorkflowNode = {
  id: string;
  type: WorkflowNodeType;
  title: string;
  description: string;
};

export type AdminAutomation = {
  id: string;
  name: string;
  description: string;
  status: "enabled" | "disabled" | "draft";
  trigger: string;
  actionsSummary: string;
  executionCount: number;
  successCount: number;
  failureCount: number;
  lastExecutedAt?: string | undefined;
  nodes: WorkflowNode[];
  runs: {
    id: string;
    status: "success" | "failure" | "running";
    startedAt: string;
    finishedAt?: string | undefined;
    message: string;
  }[];
};

export type AdminDateRange = "7d" | "30d" | "90d";

export type AdminPaginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type DashboardMetrics = {
  dataSource: "mock" | "live";
  range: AdminDateRange;
  rangeLabel: string;
  revenue: { value: number; changeLabel: string };
  orders: { value: number; changeLabel: string };
  customers: { value: number; changeLabel: string };
  newCustomers: { value: number; changeLabel: string };
  leads: { value: number; changeLabel: string };
  qualifiedLeads: { value: number; changeLabel: string };
  aov: { value: number; changeLabel: string };
  conversionRate: { value: number; changeLabel: string };
  revenueChart: { label: string; value: number }[];
  productPerformance: { productId: string; name: string; units: number; revenue: number }[];
  recentOrders: AdminOrderListItem[];
  recentLeads: AdminLead[];
  aiActivity: { label: string; count: number }[];
  automationActivity: { label: string; count: number }[];
};

export type AdminCustomerDetail = AdminCustomer & {
  skinProfile: string;
  activityTimeline: { id: string; label: string; at: string }[];
  orderHistory: AdminOrderListItem[];
  conversationIds: string[];
};

export type AdminConversationFilters = {
  q?: string | undefined;
  status?: ConversationStatus | undefined;
  channel?: ConversationChannel | undefined;
};

export type AnalyticsSnapshot = {
  dataSource: "mock" | "live";
  range: AdminDateRange;
  rangeLabel: string;
  revenue: number;
  orders: number;
  aov: number;
  customers: number;
  newCustomers: number;
  returningCustomers: number;
  repeatPurchases: number;
  leads: number;
  qualifiedLeads: number;
  conversionRate: number;
  repeatCustomers: number;
  leadSources: { source: string; count: number }[];
  leadConversionFunnel: { stage: LeadLifecycleStage; count: number }[];
  productPerformance: { name: string; revenue: number; units: number }[];
  productEngagement: {
    name: string;
    views: number;
    addToCart: number;
    purchases: number;
    conversionRate: number;
  }[];
  aiMetrics: {
    conversations: number;
    recommendations: number;
    recommendationClicks: number;
    assistedConversions: number;
    handoffRequests?: number;
    aiResponses?: number;
    customerMessages?: number;
  };
  aiAssistedConversions: number;
  automationPerformance: {
    name: string;
    successRate: number;
    runs: number;
    failures: number;
    drivenConversions: number;
  }[];
  revenueTrend?: { label: string; value: number; orders: number }[];
  orderAnalytics?: {
    ordersByStatus: { status: string; count: number }[];
    paymentSuccessRate: number;
    cancellationRate: number;
  };
  conversationMetrics?: {
    byStatus: { status: string; count: number }[];
    humanAssigned: number;
    unresolvedBacklog: number;
  };
  notificationMetrics?: {
    queued: number;
    sent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
    failureRate: number;
    byChannel: { channel: string; sent: number; failed: number }[];
    byType: { type: string; count: number }[];
  };
  inventorySummary?: { lowStock: number; outOfStock: number };
  refundMetrics?: {
    refundCount: number;
    refundTotalNgn: number;
    netRevenueNgn: number;
  };
  unavailableMetrics?: string[];
  comparisons?: {
    revenue: string;
    orders: string;
    leads: string;
    newCustomers?: string;
    customersCumulative?: string;
  };
};

export type AiAdminOverview = {
  conversationCount: number;
  recommendationCount: number;
  recommendationPerformance: { productName: string; recommendations: number; clicks: number }[];
  handoffCount: number;
  failedCount: number;
  recentConversations: { id: string; customer: string; preview: string; at: string }[];
  toolActivity: { tool: string; calls: number; lastUsed: string }[];
  config: {
    modelLabel: string;
    handoffEnabled: boolean;
    catalogSearchEnabled: boolean;
    orderLookupEnabled: boolean;
  };
  failedInteractions: { id: string; reason: string; at: string }[];
};

export type AdminSettings = {
  business: { name: string; email: string; phone: string; timezone: string };
  branding: { tagline: string; supportEmail: string };
  notifications: { orderAlerts: boolean; leadAlerts: boolean; lowStock: boolean };
  payments: { paystackConfigured: boolean; currency: string };
  integrations: { emailProvider: string; whatsappProvider: string };
  ai: { enabled: boolean; disclaimer: string; maxMessagesPerHour: number };
  automation: { enabled: boolean; defaultDelayMinutes: number };
  team: { id: string; name: string; email: string; role: string }[];
  permissions: { role: string; capabilities: string[] }[];
};

export type AdminOrderFilters = {
  q?: string | undefined;
  status?: OrderStatus | undefined;
  paymentStatus?: "pending" | "paid" | "failed" | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
};

export type AdminProductFilters = {
  q?: string | undefined;
  status?: AdminProductStatus | undefined;
  category?: string | undefined;
};

export type AdminCustomerFilters = {
  q?: string | undefined;
  lifecycle?: LeadLifecycleStage | undefined;
};

export type AdminLeadFilters = {
  q?: string | undefined;
  stage?: LeadLifecycleStage | undefined;
  status?: LeadStatus | undefined;
  source?: string | undefined;
  ownerId?: string | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
};
