import type { RequestContext } from "@/lib/auth/types";
import type {
  AdminAutomation,
  AdminConversation,
  AdminConversationFilters,
  AdminCustomerDetail,
  AdminCustomerFilters,
  AdminDateRange,
  AdminLead,
  AdminLeadFilters,
  AdminOrderDetail,
  AdminOrderFilters,
  AdminOrderListItem,
  AdminPaginated,
  AdminProduct,
  AdminProductFilters,
  AdminSettings,
  AiAdminOverview,
  AnalyticsSnapshot,
  DashboardMetrics,
  InventoryTransaction,
  WorkflowNode,
} from "@/types/admin";

export interface AdminService {
  getDashboard(ctx: RequestContext, range?: AdminDateRange): Promise<DashboardMetrics>;
  listOrders(filters?: AdminOrderFilters): Promise<AdminPaginated<AdminOrderListItem>>;
  getOrder(id: string): Promise<AdminOrderDetail | null>;
  listProducts(filters?: AdminProductFilters): Promise<AdminProduct[]>;
  getProduct(id: string): Promise<AdminProduct | null>;
  createProduct(input: Omit<AdminProduct, "id" | "createdAt" | "updatedAt">): Promise<AdminProduct>;
  updateProduct(id: string, input: Partial<AdminProduct>): Promise<AdminProduct | null>;
  archiveProduct(id: string): Promise<boolean>;
  listInventory(): Promise<{ product: AdminProduct; lowStock: boolean; outOfStock: boolean }[]>;
  listInventoryTransactions(productId?: string): Promise<InventoryTransaction[]>;
  adjustStock(
    productId: string,
    delta: number,
    note: string,
    actor: string,
  ): Promise<AdminProduct | null>;
  listCustomers(filters?: AdminCustomerFilters): Promise<AdminCustomerDetail[]>;
  getCustomer(id: string): Promise<AdminCustomerDetail | null>;
  listLeads(filters?: AdminLeadFilters): Promise<AdminPaginated<AdminLead>>;
  getLead(id: string): Promise<AdminLead | null>;
  listConversations(
    filters?: AdminConversationFilters,
    page?: number,
    pageSize?: number,
  ): Promise<AdminPaginated<Omit<AdminConversation, "messages">>>;
  getConversation(id: string): Promise<AdminConversation | null>;
  getAiOverview(): Promise<AiAdminOverview>;
  listAutomations(): Promise<Omit<AdminAutomation, "nodes" | "runs">[]>;
  getAutomation(id: string): Promise<AdminAutomation | null>;
  createAutomation(input: {
    name: string;
    description: string;
    trigger: string;
    nodes: WorkflowNode[];
  }): Promise<AdminAutomation>;
  updateAutomation(
    id: string,
    input: Partial<Pick<AdminAutomation, "name" | "description" | "trigger" | "status" | "nodes">>,
  ): Promise<AdminAutomation | null>;
  setAutomationEnabled(id: string, enabled: boolean): Promise<boolean>;
  publishAutomation(id: string): Promise<void>;
  getAnalytics(ctx: RequestContext, range?: AdminDateRange): Promise<AnalyticsSnapshot>;
  getSettings(): Promise<AdminSettings>;
}
