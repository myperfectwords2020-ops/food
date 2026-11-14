import { ExternalServiceError, PaymentError, ValidationError } from "@/lib/errors/app-error";
import { getEnv } from "@/config/env";
import type {
  PaymentProvider,
  ProviderInitializeInput,
  ProviderInitializeResult,
  ProviderVerifyResult,
} from "@/modules/payments/payment-provider.types";

const PAYSTACK_BASE = "https://api.paystack.co";
const REQUEST_TIMEOUT_MS = 15_000;

type PaystackEnvelope<T> = {
  status: boolean;
  message: string;
  data: T;
};

type InitializeData = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

type VerifyData = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  id: number;
  gateway_response?: string;
};

function secretKey(): string {
  const key = getEnv().PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new PaymentError("Paystack is not configured on the server.");
  }
  return key;
}

async function paystackFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${PAYSTACK_BASE}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${secretKey()}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch (err) {
    throw new ExternalServiceError("Payment provider is temporarily unavailable.", {
      cause: err,
    });
  }

  let body: PaystackEnvelope<T> | null = null;
  try {
    body = (await response.json()) as PaystackEnvelope<T>;
  } catch {
    throw new ExternalServiceError("Invalid response from payment provider.");
  }

  if (!response.ok || !body.status) {
    throw new PaymentError(body.message || "Payment provider request failed.");
  }

  return body.data;
}

/** NGN minor units in our DB match Paystack kobo for NGN. */
export function paystackAmountFromMinor(amountMinor: number, currency: string): number {
  if (amountMinor <= 0) throw new ValidationError("Invalid payment amount.");
  if (currency !== "NGN") {
    throw new ValidationError("Only NGN payments are supported.");
  }
  return amountMinor;
}

export function paystackMinorFromProviderAmount(amount: number, currency: string): number {
  if (currency !== "NGN") {
    throw new ValidationError("Unsupported payment currency.");
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new ValidationError("Invalid provider amount.");
  }
  return amount;
}

function mapVerifyStatus(status: string): ProviderVerifyResult["status"] {
  const s = status.toLowerCase();
  if (s === "success") return "success";
  if (s === "failed") return "failed";
  if (s === "abandoned") return "abandoned";
  return "pending";
}

export class PaystackPaymentProvider implements PaymentProvider {
  readonly name = "paystack";

  async initializeTransaction(input: ProviderInitializeInput): Promise<ProviderInitializeResult> {
    const amount = paystackAmountFromMinor(input.amountMinor, input.currency);
    const data = await paystackFetch<InitializeData>("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        amount,
        currency: input.currency,
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: input.metadata,
      }),
    });

    if (!data.authorization_url || !data.reference) {
      throw new PaymentError("Payment provider returned an incomplete initialization response.");
    }

    return {
      authorizationUrl: data.authorization_url,
      accessCode: data.access_code,
      reference: data.reference,
    };
  }

  async verifyTransaction(reference: string): Promise<ProviderVerifyResult> {
    if (!reference.trim()) throw new ValidationError("Payment reference is required.");
    const data = await paystackFetch<VerifyData>(
      `/transaction/verify/${encodeURIComponent(reference)}`,
      { method: "GET" },
    );

    const status = mapVerifyStatus(data.status);
    const currency = data.currency?.toUpperCase() ?? "NGN";
    const amountMinor = paystackMinorFromProviderAmount(data.amount, currency);

    const result: ProviderVerifyResult = {
      status,
      amountMinor,
      currency,
      reference: data.reference,
      providerTransactionId: String(data.id),
    };
    if (data.gateway_response) {
      result.failureReason = data.gateway_response;
    }
    return result;
  }
}

let cachedProvider: PaystackPaymentProvider | null = null;

export function getPaystackPaymentProvider(): PaystackPaymentProvider {
  if (!cachedProvider) cachedProvider = new PaystackPaymentProvider();
  return cachedProvider;
}
