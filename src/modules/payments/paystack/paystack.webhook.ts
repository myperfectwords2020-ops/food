import { createHmac, timingSafeEqual } from "node:crypto";

import { getEnv } from "@/config/env";
import { AuthorizationError } from "@/lib/errors/app-error";

export function verifyPaystackWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): void {
  const secret = getEnv().PAYSTACK_SECRET_KEY;
  if (!secret) {
    throw new AuthorizationError("Paystack webhook is not configured.");
  }
  if (!signatureHeader) {
    throw new AuthorizationError("Missing webhook signature.");
  }

  const hash = createHmac("sha512", secret).update(rawBody).digest("hex");
  const a = Buffer.from(hash, "utf8");
  const b = Buffer.from(signatureHeader, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new AuthorizationError("Invalid webhook signature.");
  }
}
