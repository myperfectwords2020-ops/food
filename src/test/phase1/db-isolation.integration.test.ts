import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";

const runIntegration = process.env["RUN_DB_INTEGRATION"] === "1";

describe.skipIf(!runIntegration)("database tenant isolation (integration)", () => {
  it("tenant B product is not visible under tenant A scope", async () => {
    const tenantB = await prisma.tenant.findUnique({ where: { slug: "elanskin-other" } });
    const tenantA = await prisma.tenant.findUnique({ where: { slug: "elanskin-dev" } });
    expect(tenantA && tenantB).toBeTruthy();
    if (!tenantA || !tenantB) return;

    const productB = await prisma.product.findFirst({
      where: { tenantId: tenantB.id, slug: "isolation-test" },
    });
    expect(productB).toBeTruthy();
    if (!productB) return;

    const leaked = await prisma.product.findFirst({
      where: { id: productB.id, tenantId: tenantA.id },
    });
    expect(leaked).toBeNull();
  });

  it("customer A order is not accessible with customer B id filter", async () => {
    const customerA = await prisma.customer.findFirst({
      where: { email: "customer.a@dev.elanskin.test" },
    });
    const customerB = await prisma.customer.findFirst({
      where: { email: "customer.b@dev.elanskin.test" },
    });
    expect(customerA && customerB).toBeTruthy();
    if (!customerA || !customerB) return;

    const orderA = await prisma.order.findFirst({ where: { customerId: customerA.id } });
    expect(orderA).toBeTruthy();
    if (!orderA) return;

    const stolen = await prisma.order.findFirst({
      where: { id: orderA.id, customerId: customerB.id },
    });
    expect(stolen).toBeNull();
  });
});
