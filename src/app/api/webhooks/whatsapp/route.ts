import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { getNotificationEnv } from "@/modules/notifications/notification-env";
import { assertNotificationStatusTransition } from "@/modules/notifications/notification-status.service";

export const runtime = "nodejs";

function verifyMetaSignature(rawBody: string, signatureHeader: string | null, secret: string) {
  if (!signatureHeader?.startsWith("sha256=")) throw new Error("Missing signature.");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = signatureHeader.slice("sha256=".length);
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("Invalid signature.");
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "whatsapp-webhook" });
}

export async function POST(request: Request) {
  const env = getNotificationEnv();
  if (!env.whatsappWebhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  try {
    verifyMetaSignature(
      rawBody,
      request.headers.get("x-hub-signature-256"),
      env.whatsappWebhookSecret,
    );
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: {
    entry?: { changes?: { value?: { statuses?: { id: string; status: string }[] } }[] }[];
  };
  try {
    payload = JSON.parse(rawBody) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const statuses = payload.entry?.[0]?.changes?.[0]?.value?.statuses ?? [];

  for (const status of statuses) {
    const row = await prisma.notification.findFirst({
      where: { providerMessageId: status.id, channel: "WHATSAPP" },
    });
    if (!row) continue;
    if (status.status === "delivered") {
      assertNotificationStatusTransition(row.status, "DELIVERED");
      await prisma.notification.update({
        where: { id: row.id },
        data: { status: "DELIVERED", deliveredAt: new Date() },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
