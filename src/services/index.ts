import { mockAdminService } from "./admin.mock";
import { liveAssistantService } from "./live-assistant.service";
import { liveAdminConversationService } from "./live-admin-conversation.service";
import { getLiveAiOverview } from "./live-admin-ai.service";
import { liveAccountService } from "./live-account.service";
import { createRoutineService } from "./routine.service";
import { liveOrderService } from "./live-order.service";
import { liveAdminOrderService } from "./live-admin-order.service";
import { liveAdminCatalogService } from "./live-admin-catalog.service";
import { liveAdminCustomerService } from "./live-admin-customer.service";
import { liveAdminLeadService } from "./live-admin-lead.service";
import { liveAdminAutomationService } from "./live-admin-automation.service";
import { getLiveAnalytics, getLiveDashboard } from "./live-admin-analytics.service";
import { liveCatalogService } from "./live-catalog.service";

export const catalogService = liveCatalogService;
export const routineService = createRoutineService(liveCatalogService);
export const orderService = liveOrderService;
export const accountService = liveAccountService;
export const assistantService = liveAssistantService;

export const adminService = {
  ...mockAdminService,
  listProducts: liveAdminCatalogService.listProducts,
  getProduct: liveAdminCatalogService.getProduct,
  createProduct: liveAdminCatalogService.createProduct,
  updateProduct: liveAdminCatalogService.updateProduct,
  archiveProduct: liveAdminCatalogService.archiveProduct,
  listInventory: liveAdminCatalogService.listInventory,
  listInventoryTransactions: liveAdminCatalogService.listInventoryTransactions,
  adjustStock: liveAdminCatalogService.adjustStock,
  listCustomers: liveAdminCustomerService.listCustomers,
  getCustomer: liveAdminCustomerService.getCustomer,
  listOrders: liveAdminOrderService.listOrders,
  getOrder: liveAdminOrderService.getOrder,
  listLeads: liveAdminLeadService.listLeads,
  getLead: liveAdminLeadService.getLead,
  listConversations: liveAdminConversationService.listConversations,
  getConversation: liveAdminConversationService.getConversation,
  getAiOverview: getLiveAiOverview,
  listAutomations: liveAdminAutomationService.listAutomations,
  getAutomation: liveAdminAutomationService.getAutomation,
  createAutomation: liveAdminAutomationService.createAutomation,
  updateAutomation: liveAdminAutomationService.updateAutomation,
  setAutomationEnabled: liveAdminAutomationService.setAutomationEnabled,
  publishAutomation: liveAdminAutomationService.publishAutomation,
  getDashboard: getLiveDashboard,
  getAnalytics: getLiveAnalytics,
};

export type { CatalogService } from "./catalog.service";
export type { AdminService } from "./admin.service";
export type { RoutineService } from "./routine.service";
export type { OrderService } from "./order.service";
export type { AccountService } from "./account.service";
export type { AssistantService } from "./assistant.service";
