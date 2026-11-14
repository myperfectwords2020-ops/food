import { customers, leads, orders, products } from "@/lib/skincare-data";
import type {
  AdminAutomation,
  AdminConversation,
  AdminCustomer,
  AdminLead,
  AdminProduct,
  AdminSettings,
  InventoryTransaction,
  LeadLifecycleStage,
} from "@/types/admin";

const DEFAULT_USAGE =
  "Apply to clean skin as part of your daily routine. Introduce new products gradually.";
const DEFAULT_WARNINGS =
  "Patch test before first use. Discontinue use if persistent irritation occurs.";

function mapLifecycle(raw: string): LeadLifecycleStage {
  const lower = raw.toLowerCase();
  if (lower.includes("converted") || lower === "loyal") return "REPEAT_CUSTOMER";
  if (lower === "new") return "CUSTOMER";
  if (lower === "qualified") return "QUALIFIED";
  if (lower === "contacted") return "LEAD";
  return "LEAD";
}

function mapLeadStage(stage: string): LeadLifecycleStage {
  if (stage === "Converted") return "CUSTOMER";
  if (stage === "Qualified") return "QUALIFIED";
  if (stage === "Contacted") return "LEAD";
  return "LEAD";
}

export function seedAdminProducts(): AdminProduct[] {
  const now = "2026-03-01T10:00:00.000Z";
  return products.map((p, i) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    description: p.description,
    price: p.price,
    image: p.image,
    concern: p.concern,
    skinTypes: [...p.skinTypes],
    ingredients: [...p.ingredients],
    stock: p.stock,
    status: "active" as const,
    badge: p.badge,
    usageInstructions: DEFAULT_USAGE,
    warnings: DEFAULT_WARNINGS,
    recommendationNote: "Suggested for routines addressing " + p.concern.toLowerCase() + ".",
    relatedProductIds: products
      .filter((x) => x.id !== p.id)
      .slice(0, 2)
      .map((x) => x.id),
    createdAt: now,
    updatedAt: now,
  }));
}

export function seedCustomers(): AdminCustomer[] {
  return customers.map((c, i) => ({
    id: `cust-${i + 1}`,
    name: c.name,
    email: c.email,
    phone: c.phone,
    lifecycle: mapLifecycle(c.lifecycle),
    ordersCount: c.orders,
    totalSpent: c.spent,
    lastActivity: c.activity,
    leadId: i === 0 ? "lead-4" : undefined,
    preferencesSummary: "Email offers on · Fragrance-free preferred",
    recommendationSlugs: ["vitamin-c-brightening-serum", "barrier-repair-moisturizer"],
  }));
}

export function seedLeads(): AdminLead[] {
  return leads.map((l, i) => ({
    id: `lead-${i + 1}`,
    name: l.name,
    email: `${l.name.split(" ")[0]?.toLowerCase()}@example.com`,
    phone: "+234 800 000 000" + i,
    source: l.source,
    stage: mapLeadStage(l.stage),
    status:
      l.stage === "Converted"
        ? "CONVERTED"
        : l.stage === "Qualified"
          ? "QUALIFIED"
          : l.stage === "Contacted"
            ? "CONTACTED"
            : "NEW",
    score: l.stage === "Qualified" || l.stage === "Converted" ? 72 : 35,
    qualification:
      l.stage === "Qualified" || l.stage === "Converted"
        ? "sales_qualified"
        : l.stage === "Contacted"
          ? "marketing_qualified"
          : "unqualified",
    owner: l.owner,
    concern: l.concern,
    interest: l.interest,
    notes: [`Interested in ${l.interest}.`, "Follow up with routine PDF."],
    timeline: [
      { id: `tl-${i}-1`, label: `Captured via ${l.source}`, at: "2026-03-05T09:00:00Z" },
      { id: `tl-${i}-2`, label: `Stage: ${l.stage}`, at: "2026-03-05T12:00:00Z" },
    ],
    interestedProductIds: ["p2", "p1"].slice(0, 1 + (i % 2)),
    aiRecommendationSlugs: ["niacinamide-balance-serum"],
    followUpAt: l.stage === "New" ? "2026-03-07T10:00:00Z" : undefined,
    convertedCustomerId: l.stage === "Converted" ? "cust-1" : undefined,
    lastActivity: l.activity,
  }));
}

export function seedConversations(): AdminConversation[] {
  return [
    {
      id: "conv-1",
      customerName: "Ifeoma Chukwu",
      customerEmail: "ifeoma@example.com",
      channel: "ai_assistant",
      status: "active",
      subject: "Sensitive cleanser recommendation",
      lastMessageAt: "2026-03-06T14:22:00Z",
      contextSummary: "Dry skin · prefers fragrance-free · browsing cleansers",
      leadId: "lead-2",
      messages: [
        {
          id: "m1",
          role: "customer",
          body: "I need a gentle cleanser for dry sensitive skin.",
          at: "2026-03-06T14:20:00Z",
        },
        {
          id: "m2",
          role: "ai",
          body: "Based on our catalog, Dewdrop Hydrating Cleanser is formulated for dry and sensitive skin. This is product guidance only—not medical advice.",
          at: "2026-03-06T14:21:00Z",
          recommendedProductSlugs: ["hydrating-cleanser"],
        },
      ],
    },
    {
      id: "conv-2",
      customerName: "Amara Okoye",
      customerEmail: "amara@example.com",
      channel: "whatsapp",
      status: "handoff_requested",
      subject: "Order SK-1048 delivery",
      lastMessageAt: "2026-03-06T09:40:00Z",
      contextSummary: "Repeat customer · order in processing",
      assignedToName: "Maya",
      handoffRequested: true,
      messages: [
        {
          id: "m3",
          role: "customer",
          body: "When will my order ship?",
          at: "2026-03-06T09:35:00Z",
        },
        {
          id: "m4",
          role: "human",
          body: "Your order is processing and should ship within 24 hours.",
          at: "2026-03-06T09:40:00Z",
        },
      ],
    },
  ];
}

export function seedAutomations(): AdminAutomation[] {
  const nodes = [
    {
      id: "n1",
      type: "TRIGGER" as const,
      title: "Cart abandoned",
      description: "Customer leaves checkout with items in bag",
    },
    {
      id: "n2",
      type: "DELAY" as const,
      title: "Wait 2 hours",
      description: "Quiet period before outreach",
    },
    {
      id: "n3",
      type: "NOTIFICATION" as const,
      title: "Send recovery email",
      description: "WhatsApp or email via approved template",
    },
    {
      id: "n4",
      type: "END" as const,
      title: "End",
      description: "Workflow complete",
    },
  ];
  return [
    {
      id: "auto-1",
      name: "Abandoned cart recovery",
      description: "Recover checkout drop-offs with a timed email or WhatsApp nudge.",
      status: "enabled",
      trigger: "cart.abandoned",
      actionsSummary: "Delay · Email · End",
      executionCount: 128,
      successCount: 96,
      failureCount: 4,
      lastExecutedAt: "2026-03-06T08:00:00Z",
      nodes,
      runs: [
        {
          id: "run-1",
          status: "success",
          startedAt: "2026-03-06T08:00:00Z",
          finishedAt: "2026-03-06T08:00:12Z",
          message: "Email queued for 3 customers",
        },
      ],
    },
    {
      id: "auto-2",
      name: "Post-purchase thank you",
      description: "Send care instructions after server-confirmed payment.",
      status: "enabled",
      trigger: "order.paid",
      actionsSummary: "Notification · End",
      executionCount: 412,
      successCount: 410,
      failureCount: 2,
      lastExecutedAt: "2026-03-06T07:15:00Z",
      nodes: [
        {
          id: "n1",
          type: "TRIGGER",
          title: "Order paid",
          description: "Payment confirmed server-side",
        },
        {
          id: "n2",
          type: "NOTIFICATION",
          title: "Thank-you message",
          description: "Email with care instructions",
        },
        { id: "n3", type: "END", title: "End", description: "Done" },
      ],
      runs: [],
    },
  ];
}

export function seedInventoryTransactions(products: AdminProduct[]): InventoryTransaction[] {
  return products.slice(0, 4).flatMap((p, i) => [
    {
      id: `inv-${p.id}-1`,
      productId: p.id,
      productName: p.name,
      type: "restock" as const,
      delta: 20,
      balanceAfter: p.stock,
      note: "Initial mock restock",
      createdAt: "2026-02-28T10:00:00Z",
      actor: "Maya",
    },
    {
      id: `inv-${p.id}-2`,
      productId: p.id,
      productName: p.name,
      type: "sale" as const,
      delta: -2 - i,
      balanceAfter: Math.max(0, p.stock - 2),
      note: "Order allocation",
      createdAt: "2026-03-05T16:00:00Z",
      actor: "System",
    },
  ]);
}

export function seedSettings(): AdminSettings {
  return {
    business: {
      name: "Velora",
      email: "hello@elanskin.example",
      phone: "+234 800 000 0000",
      timezone: "Africa/Lagos",
    },
    branding: { tagline: "Skincare, makeup & fragrance", supportEmail: "care@elanbeauty.example" },
    notifications: { orderAlerts: true, leadAlerts: true, lowStock: true },
    payments: {
      paystackConfigured: Boolean(process.env["NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY"]),
      currency: "NGN",
    },
    integrations: { emailProvider: "Not connected", whatsappProvider: "Not connected" },
    ai: {
      enabled: true,
      disclaimer: "Product guidance only—not medical advice.",
      maxMessagesPerHour: 30,
    },
    automation: { enabled: true, defaultDelayMinutes: 120 },
    team: [
      { id: "u1", name: "Maya Okon", email: "maya@elanskin.example", role: "Owner" },
      { id: "u2", name: "Ada Bello", email: "ada@elanskin.example", role: "Operations" },
    ],
    permissions: [
      { role: "Owner", capabilities: ["all"] },
      { role: "Operations", capabilities: ["orders", "products", "leads", "conversations"] },
    ],
  };
}

export const legacyOrderRows = orders;
