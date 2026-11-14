import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

import { ensureDefaultDeliveryRatesForTenant } from "../src/modules/commerce/delivery-rate.service";

const prisma = new PrismaClient();

const DEV_PASSWORD = "DevPassword123!";

async function createStaffUser(input: {
  tenantId: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "STAFF" | "CUSTOMER";
  firstName: string;
  lastName: string;
  withCustomer?: boolean;
}) {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: {
      tenantId_email: { tenantId: input.tenantId, email: input.email },
    },
    update: {
      passwordHash,
      role: input.role,
      status: "ACTIVE",
      firstName: input.firstName,
      lastName: input.lastName,
    },
    create: {
      tenantId: input.tenantId,
      email: input.email,
      passwordHash,
      role: input.role,
      status: "ACTIVE",
      firstName: input.firstName,
      lastName: input.lastName,
    },
  });

  if (input.withCustomer) {
    const customer = await prisma.customer.upsert({
      where: { userId: user.id },
      update: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
      },
      create: {
        tenantId: input.tenantId,
        userId: user.id,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        lifecycle: "CUSTOMER",
      },
    });
    await prisma.customerPreference.upsert({
      where: { customerId: customer.id },
      update: {},
      create: { tenantId: input.tenantId, customerId: customer.id },
    });
    return { user, customer };
  }

  return { user, customer: null };
}

async function main() {
  const tenantA = await prisma.tenant.upsert({
    where: { slug: "elanskin-dev" },
    update: { name: "GreenCart Development", status: "ACTIVE" },
    create: { slug: "elanskin-dev", name: "GreenCart Development", status: "ACTIVE" },
  });

  const tenantB = await prisma.tenant.upsert({
    where: { slug: "elanskin-other" },
    update: { name: "Other Beauty Co", status: "ACTIVE" },
    create: { slug: "elanskin-other", name: "Other Beauty Co", status: "ACTIVE" },
  });

  await prisma.tenantSettings.upsert({
    where: { tenantId: tenantA.id },
    update: {},
    create: { tenantId: tenantA.id },
  });

  await createStaffUser({
    tenantId: tenantA.id,
    email: "super@dev.elanskin.test",
    role: "SUPER_ADMIN",
    firstName: "Super",
    lastName: "Admin",
  });

  await createStaffUser({
    tenantId: tenantA.id,
    email: "admin@dev.elanskin.test",
    role: "ADMIN",
    firstName: "Tenant",
    lastName: "Admin",
  });

  await createStaffUser({
    tenantId: tenantA.id,
    email: "staff@dev.elanskin.test",
    role: "STAFF",
    firstName: "Store",
    lastName: "Staff",
  });

  const { customer: customerA } = await createStaffUser({
    tenantId: tenantA.id,
    email: "customer.a@dev.elanskin.test",
    role: "CUSTOMER",
    firstName: "Customer",
    lastName: "Alpha",
    withCustomer: true,
  });

  const { customer: customerB } = await createStaffUser({
    tenantId: tenantA.id,
    email: "customer.b@dev.elanskin.test",
    role: "CUSTOMER",
    firstName: "Customer",
    lastName: "Beta",
    withCustomer: true,
  });

  if (customerA) {
    const address = await prisma.address.create({
      data: {
        tenantId: tenantA.id,
        customerId: customerA.id,
        label: "Home",
        street: "14 Adeola Odeku Street",
        city: "Victoria Island",
        state: "Lagos",
        isDefault: true,
      },
    });

    const seededOrder = await prisma.order.findFirst({
      where: { tenantId: tenantA.id, orderNumber: "ELN-2026-000001" },
    });
    if (!seededOrder) {
      await prisma.order.create({
        data: {
          tenantId: tenantA.id,
          customerId: customerA.id,
          addressId: address.id,
          orderNumber: "ELN-2026-000001",
          status: "PAID",
          subtotalMinor: 1800000,
          deliveryMinor: 150000,
          discountMinor: 0,
          totalMinor: 1950000,
          customerEmail: customerA.email,
          customerName: "Customer Alpha",
          items: {
            create: [
              {
                tenantId: tenantA.id,
                productName: "Fresh Atlantic Salmon",
                productSlug: "fresh-atlantic-salmon",
                unitPriceMinor: 900000,
                quantity: 2,
                lineTotalMinor: 1800000,
              },
            ],
          },
        },
      });
    }
  }

  await prisma.product.upsert({
    where: { tenantId_slug: { tenantId: tenantB.id, slug: "isolation-test" } },
    update: {},
    create: {
      tenantId: tenantB.id,
      slug: "isolation-test",
      name: "Tenant B Product",
      description: "Isolation test product",
      status: "ACTIVE",
      priceMinor: 100000,
      stock: 5,
    },
  });

  await ensureDefaultDeliveryRatesForTenant(tenantA.id);

  const { seedCatalog } = await import("./seed-catalog");
  await seedCatalog(prisma, tenantA.id);

  console.log("Seed complete. Development password for all users:", DEV_PASSWORD);
  console.log("Default tenant slug: elanskin-dev");
  console.log("Logins: super@dev.elanskin.test, admin@dev.elanskin.test, staff@dev.elanskin.test");
  console.log("Customers: customer.a@dev.elanskin.test, customer.b@dev.elanskin.test");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
