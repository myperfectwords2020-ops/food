import { NextResponse } from "next/server";

import { normalizeError } from "@/lib/errors/app-error";
import {
  processPaystackWebhook,
  type PaystackWebhookPayload,
} from "@/modules/payments/payment-application.service";
import { getPaystackPaymentProvider } from "@/modules/payments/paystack/paystack.client";
import { verifyPaystackWebhookSignature } from "@/modules/payments/paystack/paystack.webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  try {
    verifyPaystackWebhookSignature(rawBody, signature);
  } catch (error) {
    const e = normalizeError(error);
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  let payload: PaystackWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as PaystackWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const reference = payload.data?.reference;
  const externalId = `${payload.event}:${reference ?? "unknown"}`;

  try {
    const result = await processPaystackWebhook({
      payload,
      externalId,
      provider: getPaystackPaymentProvider(),
    });
    return NextResponse.json({ ok: true, result: result.status });
  } catch (error) {
    const e = normalizeError(error);
    return NextResponse.json(
      { error: e.expose ? e.message : "Webhook processing failed." },
      { status: e.status >= 400 ? e.status : 500 },
    );
  }
}
