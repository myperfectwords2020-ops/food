import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  const key = process.env["AUTH_SECRET"];
  if (!key || key.length < 32) throw new Error("AUTH_SECRET required for unsubscribe tokens.");
  return key;
}

export function createMarketingUnsubscribeToken(input: {
  tenantId: string;
  customerId: string;
  channel: "EMAIL" | "WHATSAPP";
}): string {
  const payload = `${input.tenantId}:${input.customerId}:${input.channel}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyMarketingUnsubscribeToken(token: string): {
  tenantId: string;
  customerId: string;
  channel: "EMAIL" | "WHATSAPP";
} | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 4) return null;
    const [tenantId, customerId, channel, sig] = parts as [string, string, string, string];
    if (channel !== "EMAIL" && channel !== "WHATSAPP") return null;
    const payload = `${tenantId}:${customerId}:${channel}`;
    const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return { tenantId, customerId, channel };
  } catch {
    return null;
  }
}

export async function applyMarketingUnsubscribe(token: string) {
  const parsed = verifyMarketingUnsubscribeToken(token);
  if (!parsed) return { ok: false as const, error: "Invalid token." };

  const { prisma } = await import("@/lib/db/prisma");
  const customer = await prisma.customer.findFirst({
    where: { id: parsed.customerId, tenantId: parsed.tenantId },
  });
  if (!customer) return { ok: false as const, error: "Invalid token." };

  await prisma.customerPreference.upsert({
    where: { customerId: parsed.customerId },
    create: {
      tenantId: parsed.tenantId,
      customerId: parsed.customerId,
      emailOffers: parsed.channel !== "EMAIL",
      whatsappOffers: parsed.channel !== "WHATSAPP",
    },
    update: {
      ...(parsed.channel === "EMAIL" ? { emailOffers: false } : {}),
      ...(parsed.channel === "WHATSAPP" ? { whatsappOffers: false } : {}),
    },
  });

  return { ok: true as const };
}
