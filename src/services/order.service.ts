import { orders as legacyOrders } from "@/lib/skincare-data";
import { buildCartSummary } from "@/services/cart.service";
import { mockCatalogService } from "@/services/catalog.mock";
import type { CheckoutInput, Order } from "@/types/commerce";

export interface OrderService {
  createOrder(input: CheckoutInput, summary: Order["summary"]): Promise<Order>;
  getOrder(id: string): Promise<Order | null>;
  listOrdersForAccount(): Promise<Order[]>;
}

const orders = new Map<string, Order>();

function legacyStatus(status: string): Order["status"] {
  if (status === "Delivered") return "delivered";
  if (status === "Shipped") return "shipped";
  if (status === "Awaiting") return "pending_payment";
  return "processing";
}

export const mockOrderService: OrderService = {
  async createOrder(input, summary) {
    const id = `SK-${1050 + orders.size}`;
    const order: Order = {
      id,
      createdAt: new Date().toISOString(),
      status: "pending_payment",
      paymentStatus: "pending",
      customer: input.customer,
      address: input.address,
      lines: summary.lines,
      summary,
      deliveryEstimate: "2–4 business days after payment confirmation",
    };
    orders.set(id, order);
    return order;
  },

  async getOrder(id) {
    const dynamic = orders.get(id);
    if (dynamic) return dynamic;

    const legacy = legacyOrders.find((o) => o.id === id);
    if (!legacy) return null;

    const catalogItems = (await mockCatalogService.listProducts({ pageSize: 3 })).items;
    const lines = catalogItems.map((p, i) => ({
      productId: p.id,
      quantity: i === 0 ? 2 : 1,
      name: p.name,
      slug: p.slug,
      image: p.image,
      unitPrice: p.price,
      lineTotal: p.price * (i === 0 ? 2 : 1),
      maxQuantity: p.stock,
    }));
    const summary = await buildCartSummary(mockCatalogService, lines, { includeDelivery: true });
    summary.total = legacy.amount;

    return {
      id: legacy.id,
      createdAt: new Date().toISOString(),
      status: legacyStatus(legacy.status),
      paymentStatus: legacy.payment === "Paid" ? "paid" : "pending",
      customer: {
        email: "amara@example.com",
        phone: "+234 803 555 0148",
        firstName: "Amara",
        lastName: "Okoye",
      },
      address: {
        street: "14 Adeola Odeku Street",
        city: "Victoria Island",
        state: "Lagos",
      },
      lines,
      summary,
      deliveryEstimate: "Standard delivery · Lagos, Nigeria",
    };
  },

  async listOrdersForAccount() {
    return [...orders.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
};
