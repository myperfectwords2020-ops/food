import { describe, expect, it } from "vitest";

import type { RequestContext } from "@/lib/auth/types";
import { mockAdminService } from "@/services/admin.mock";

const mockCtx: RequestContext = {
  userId: "test-admin",
  email: "admin@test.local",
  role: "ADMIN",
  tenantId: "tenant-1",
  permissions: [],
  customerId: null,
};

describe("mockAdminService", () => {
  it("returns dashboard metrics", async () => {
    const dash = await mockAdminService.getDashboard(mockCtx, "30d");
    expect(dash.dataSource).toBe("mock");
    expect(dash.recentOrders.length).toBeGreaterThan(0);
    expect(dash.revenue.value).toBeGreaterThanOrEqual(0);
    expect(dash.qualifiedLeads.value).toBeGreaterThanOrEqual(0);
  });

  it("paginates orders", async () => {
    const page1 = await mockAdminService.listOrders({ page: 1, pageSize: 2 });
    expect(page1.items.length).toBeLessThanOrEqual(2);
    expect(page1.totalPages).toBeGreaterThanOrEqual(1);
  });

  it("lists and filters products", async () => {
    const all = await mockAdminService.listProducts();
    expect(all.length).toBeGreaterThan(0);
    const filtered = await mockAdminService.listProducts({ q: "serum" });
    expect(
      filtered.every(
        (p) => p.name.toLowerCase().includes("serum") || p.category.toLowerCase().includes("serum"),
      ),
    ).toBe(true);
  });

  it("loads automation with workflow nodes", async () => {
    const list = await mockAdminService.listAutomations();
    const first = list[0];
    expect(first).toBeDefined();
    const detail = await mockAdminService.getAutomation(first!.id);
    expect(detail?.nodes.some((n) => n.type === "TRIGGER")).toBe(true);
  });
});
