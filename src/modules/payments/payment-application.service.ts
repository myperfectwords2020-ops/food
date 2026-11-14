import type { Prisma } from "@prisma/client";

import { writeAuditLog } from "@/lib/audit/audit-log.service";
import { authorize } from "@/lib/auth/authorize-context";
import type { RequestContext } from "@/lib/auth/types";
import { checkoutTransactionOptions } from "@/lib/db/transaction-options";
import { prisma } from "@/lib/db/prisma";
import {
  dispatchDomainEvents,
  enqueueDomainEventInTransaction,
} from "@/lib/events/domain-event-outbox";
import { DomainEventTypes, type DomainEvent } from "@/lib/events/domain-events";
import {
  ConflictError,
  NotFoundError,
  PaymentError,
  ValidationError,
} from "@/lib/errors/app-error";
import { reserveAllInventoryInTransaction } from "@/modules/inventory/checkout-inventory.service";
import {
  finalizeInventoryForPaidOrder,
  releaseInventoryForOrder,
} from "@/modules/inventory/payment-inventory.service";
import type { PaymentProvider } from "@/modules/payments/payment-provider.types";
import { referenceForProviderInitialize } from "@/modules/payments/payment-reference";
import {
  assertPaymentAmountAndCurrency,
  orderBlocksNewPayment,
  orderEligibleForPayment,
} from "@/modules/payments/payment-validation";
import { getPaystackPaymentProvider } from "@/modules/payments/paystack/paystack.client";

export type InitializePaymentForOrderResult = {
  authorizationUrl: string;
  reference: string;
  amountMinor: number;
  currency: string;
};

export type ApplyPaymentOutcome = {
  orderId: string;
  paymentStatus: "paid" | "pending" | "failed";
  orderStatus: string;
  alreadyProcessed: boolean;
};

function appBaseUrl(): string {
  const url = process.env["NEXT_PUBLIC_APP_URL"];
  if (!url) throw new PaymentError("Application URL is not configured.");
  return url.replace(/\/$/, "");
}

function callbackUrl(orderId: string): string {
  const base = appBaseUrl();
  const params = new URLSearchParams({ order: orderId });
  return `${base}/order-confirmation?${params.toString()}`;
}

async function loadOrderForCustomerPayment(
  context: RequestContext & { customerId: string },
  orderId: string,
) {
  const tenantId = context.tenantId!;
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId, customerId: context.customerId },
    include: {
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) throw new NotFoundError("Order not found.");
  return order;
}

function activePendingPayment(
  payments: {
    id: string;
    status: string;
    providerReference: string | null;
    amountMinor: number;
    currency: string;
  }[],
) {
  return payments.find((p) => p.status === "PENDING" || p.status === "PROCESSING");
}

async function ensureOrderInventoryReserved(
  context: RequestContext & { customerId: string },
  orderId: string,
) {
  const tenantId = context.tenantId!;
  const activeCount = await prisma.inventoryReservation.count({
    where: { tenantId, orderId, status: "ACTIVE" },
  });
  if (activeCount > 0) return;

  const items = await prisma.orderItem.findMany({
    where: { tenantId, orderId },
    select: { productId: true, quantity: true },
  });
  const lines = items
    .filter((i) => i.productId)
    .map((i) => ({
      productId: i.productId!,
      quantity: i.quantity,
    }));
  if (lines.length === 0) throw new ConflictError("Order has no items to reserve.");

  await prisma.$transaction(async (tx) => {
    await reserveAllInventoryInTransaction(tx, {
      tenantId,
      orderId,
      lines,
      actorUserId: context.userId,
    });
  }, checkoutTransactionOptions);
}

export async function initializePaymentForOrder(
  context: RequestContext & { customerId: string },
  orderId: string,
  provider: PaymentProvider = getPaystackPaymentProvider(),
): Promise<InitializePaymentForOrderResult> {
  authorize(context, "payments.initialize_own");
  const tenantId = context.tenantId!;
  const order = await loadOrderForCustomerPayment(context, orderId);

  if (orderBlocksNewPayment(order.status)) {
    throw new ConflictError("This order is no longer eligible for payment.");
  }
  if (!orderEligibleForPayment(order.status)) {
    throw new ConflictError("This order cannot accept payment right now.");
  }

  const succeeded = order.payments.some((p) => p.status === "SUCCEEDED");
  if (succeeded || order.status === "PAID") {
    throw new ConflictError("This order has already been paid.");
  }

  let payment = activePendingPayment(order.payments);
  if (!payment) {
    payment = await prisma.payment.create({
      data: {
        tenantId,
        orderId: order.id,
        status: "PENDING",
        amountMinor: order.totalMinor,
        currency: order.currency,
      },
    });
  } else if (payment.amountMinor !== order.totalMinor || payment.currency !== order.currency) {
    throw new ConflictError("Order total changed. Contact support before paying again.");
  }

  await ensureOrderInventoryReserved(context, order.id);

  const reference = referenceForProviderInitialize();

  const init = await provider.initializeTransaction({
    email: order.customerEmail,
    amountMinor: order.totalMinor,
    currency: order.currency,
    reference,
    callbackUrl: callbackUrl(order.id),
    metadata: { orderId: order.id, tenantId },
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      providerReference: init.reference,
      status: "PROCESSING",
      provider: provider.name,
    },
  });

  await writeAuditLog({
    tenantId,
    actorId: context.userId,
    action: "PAYMENT_INITIALIZED",
    entityType: "Payment",
    entityId: payment.id,
    metadata: { orderId: order.id, reference: init.reference },
  });

  return {
    authorizationUrl: init.authorizationUrl,
    reference: init.reference,
    amountMinor: order.totalMinor,
    currency: order.currency,
  };
}

export async function applyVerifiedProviderPayment(input: {
  tenantId: string;
  reference: string;
  providerAmountMinor: number;
  providerCurrency: string;
  providerStatus: "success" | "failed" | "pending" | "abandoned";
  providerTransactionId?: string;
  failureReason?: string;
  actorUserId?: string;
  source: "verify" | "webhook";
}): Promise<ApplyPaymentOutcome> {
  const payment = await prisma.payment.findFirst({
    where: { tenantId: input.tenantId, providerReference: input.reference },
    include: { order: true },
  });

  if (!payment) {
    throw new NotFoundError("Payment reference not found.");
  }

  if (payment.status === "SUCCEEDED") {
    return {
      orderId: payment.orderId,
      paymentStatus: "paid",
      orderStatus: payment.order.status,
      alreadyProcessed: true,
    };
  }

  if (input.providerStatus === "pending") {
    return {
      orderId: payment.orderId,
      paymentStatus: "pending",
      orderStatus: payment.order.status,
      alreadyProcessed: false,
    };
  }

  if (input.providerStatus === "failed" || input.providerStatus === "abandoned") {
    const events: DomainEvent[] = [];
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          failureReason: input.failureReason?.slice(0, 500) ?? input.providerStatus,
        },
      });

      if (payment.order.status === "PENDING_PAYMENT") {
        await releaseInventoryForOrder(tx, {
          tenantId: input.tenantId,
          orderId: payment.orderId,
          actorUserId: input.actorUserId,
        });
      }

      const failedEvent: DomainEvent = {
        type: DomainEventTypes.PAYMENT_FAILED,
        tenantId: input.tenantId,
        occurredAt: new Date().toISOString(),
        payload: { orderId: payment.orderId, paymentId: payment.id, reference: input.reference },
        correlationId: payment.orderId,
      };
      await enqueueDomainEventInTransaction(tx, failedEvent);
      events.push(failedEvent);
    }, checkoutTransactionOptions);

    await writeAuditLog({
      tenantId: input.tenantId,
      actorId: input.actorUserId,
      action: "PAYMENT_FAILED",
      entityType: "Payment",
      entityId: payment.id,
      metadata: { reference: input.reference, source: input.source },
    });

    await dispatchDomainEvents(events);

    return {
      orderId: payment.orderId,
      paymentStatus: "failed",
      orderStatus: payment.order.status,
      alreadyProcessed: false,
    };
  }

  assertPaymentAmountAndCurrency({
    expectedAmountMinor: payment.order.totalMinor,
    expectedCurrency: payment.order.currency,
    providerAmountMinor: input.providerAmountMinor,
    providerCurrency: input.providerCurrency,
  });

  if (payment.amountMinor !== payment.order.totalMinor) {
    await writeAuditLog({
      tenantId: input.tenantId,
      action: "PAYMENT_AMOUNT_MISMATCH",
      entityType: "Payment",
      entityId: payment.id,
      metadata: { reference: input.reference },
    });
    throw new ValidationError("Stored payment amount does not match order total.");
  }

  const events: DomainEvent[] = [];
  await prisma.$transaction(async (tx) => {
    const fresh = await tx.payment.findFirst({
      where: { id: payment.id, tenantId: input.tenantId },
      include: { order: true },
    });
    if (!fresh) throw new NotFoundError("Payment not found.");
    if (fresh.status === "SUCCEEDED") return;

    if (fresh.order.status === "PAID") {
      await tx.payment.update({
        where: { id: fresh.id },
        data: {
          status: "SUCCEEDED",
          paidAt: new Date(),
          providerTransactionId: input.providerTransactionId ?? null,
        },
      });
      return;
    }

    if (!orderEligibleForPayment(fresh.order.status)) {
      throw new ConflictError("Order is not awaiting payment.");
    }

    await tx.payment.update({
      where: { id: fresh.id },
      data: {
        status: "SUCCEEDED",
        paidAt: new Date(),
        providerTransactionId: input.providerTransactionId ?? null,
      },
    });

    await tx.order.update({
      where: { id: fresh.orderId },
      data: { status: "PAID" },
    });

    await finalizeInventoryForPaidOrder(tx, {
      tenantId: input.tenantId,
      orderId: fresh.orderId,
      actorUserId: input.actorUserId,
    });

    const paidPayload = {
      orderId: fresh.orderId,
      paymentId: fresh.id,
      reference: input.reference,
      amountMinor: fresh.amountMinor,
      currency: fresh.currency,
    };

    const paymentSucceeded: DomainEvent = {
      type: DomainEventTypes.PAYMENT_SUCCEEDED,
      tenantId: input.tenantId,
      occurredAt: new Date().toISOString(),
      payload: paidPayload,
      correlationId: fresh.orderId,
    };
    const orderPaid: DomainEvent = {
      type: DomainEventTypes.ORDER_PAID,
      tenantId: input.tenantId,
      occurredAt: new Date().toISOString(),
      payload: paidPayload,
      correlationId: fresh.orderId,
    };

    await enqueueDomainEventInTransaction(tx, paymentSucceeded);
    await enqueueDomainEventInTransaction(tx, orderPaid);
    events.push(paymentSucceeded, orderPaid);
  }, checkoutTransactionOptions);

  await writeAuditLog({
    tenantId: input.tenantId,
    actorId: input.actorUserId,
    action: "PAYMENT_SUCCEEDED",
    entityType: "Payment",
    entityId: payment.id,
    metadata: { reference: input.reference, source: input.source },
  });

  await dispatchDomainEvents(events);

  return {
    orderId: payment.orderId,
    paymentStatus: "paid",
    orderStatus: "PAID",
    alreadyProcessed: events.length === 0,
  };
}

export async function verifyPaymentForCustomer(
  context: RequestContext & { customerId: string },
  orderId: string,
  referenceFromClient?: string | undefined,
  provider: PaymentProvider = getPaystackPaymentProvider(),
): Promise<ApplyPaymentOutcome> {
  authorize(context, "payments.verify_own");
  const tenantId = context.tenantId!;
  const order = await loadOrderForCustomerPayment(context, orderId);

  const payment = order.payments.find(
    (p) =>
      p.providerReference &&
      (referenceFromClient ? p.providerReference === referenceFromClient : true),
  );

  const reference =
    referenceFromClient ??
    payment?.providerReference ??
    order.payments.find((p) => p.providerReference)?.providerReference;

  if (!reference) {
    throw new ValidationError("No payment reference to verify.");
  }

  if (referenceFromClient && payment && payment.providerReference !== referenceFromClient) {
    throw new ValidationError("Payment reference does not match this order.");
  }

  await writeAuditLog({
    tenantId,
    actorId: context.userId,
    action: "PAYMENT_VERIFICATION_REQUESTED",
    entityType: "Order",
    entityId: orderId,
    metadata: { reference },
  });

  const verified = await provider.verifyTransaction(reference);

  if (verified.currency !== order.currency) {
    await writeAuditLog({
      tenantId,
      action: "PAYMENT_CURRENCY_MISMATCH",
      entityType: "Payment",
      metadata: { reference, orderId },
    });
    throw new ValidationError("Payment currency does not match the order.");
  }

  return applyVerifiedProviderPayment({
    tenantId,
    reference: verified.reference,
    providerAmountMinor: verified.amountMinor,
    providerCurrency: verified.currency,
    providerStatus: verified.status,
    ...(verified.providerTransactionId
      ? { providerTransactionId: verified.providerTransactionId }
      : {}),
    ...(verified.failureReason ? { failureReason: verified.failureReason } : {}),
    actorUserId: context.userId,
    source: "verify",
  });
}

export type PaystackWebhookPayload = {
  event: string;
  data: {
    reference?: string;
    amount?: number;
    currency?: string;
    status?: string;
    id?: number;
    gateway_response?: string;
  };
};

export async function processPaystackWebhook(input: {
  payload: PaystackWebhookPayload;
  externalId: string;
  provider: PaymentProvider;
}): Promise<{ status: "processed" | "ignored" | "duplicate" }> {
  const reference = input.payload.data.reference;
  if (!reference) {
    return { status: "ignored" };
  }

  const payment = await prisma.payment.findFirst({
    where: { providerReference: reference },
    include: { order: true },
  });

  if (!payment) {
    await writeAuditLog({
      action: "PAYMENT_WEBHOOK_RECEIVED",
      entityType: "WebhookEvent",
      metadata: { reference, event: input.payload.event, unknown: true },
    });
    return { status: "ignored" };
  }

  const tenantId = payment.tenantId;

  const existing = await prisma.webhookEvent.findFirst({
    where: { provider: "paystack", externalId: input.externalId },
  });
  if (existing?.status === "PROCESSED") {
    await writeAuditLog({
      tenantId,
      action: "PAYMENT_WEBHOOK_DUPLICATE",
      entityType: "WebhookEvent",
      entityId: existing.id,
      metadata: { externalId: input.externalId },
    });
    return { status: "duplicate" };
  }

  const webhookRow =
    existing ??
    (await prisma.webhookEvent.create({
      data: {
        tenantId,
        provider: "paystack",
        eventType: input.payload.event,
        externalId: input.externalId,
        payload: input.payload as Prisma.InputJsonValue,
        status: "RECEIVED",
      },
    }));

  await writeAuditLog({
    tenantId,
    action: "PAYMENT_WEBHOOK_RECEIVED",
    entityType: "WebhookEvent",
    entityId: webhookRow.id,
    metadata: { event: input.payload.event, reference },
  });

  const event = input.payload.event;
  if (event !== "charge.success" && event !== "charge.failed") {
    await prisma.webhookEvent.update({
      where: { id: webhookRow.id },
      data: { status: "IGNORED", processedAt: new Date() },
    });
    return { status: "ignored" };
  }

  const verified = await input.provider.verifyTransaction(reference);

  try {
    await applyVerifiedProviderPayment({
      tenantId,
      reference: verified.reference,
      providerAmountMinor: verified.amountMinor,
      providerCurrency: verified.currency,
      providerStatus: event === "charge.failed" ? "failed" : verified.status,
      ...(verified.providerTransactionId
        ? { providerTransactionId: verified.providerTransactionId }
        : {}),
      ...(verified.failureReason ? { failureReason: verified.failureReason } : {}),
      source: "webhook",
    });

    await prisma.webhookEvent.update({
      where: { id: webhookRow.id },
      data: { status: "PROCESSED", processedAt: new Date() },
    });

    await writeAuditLog({
      tenantId,
      action: "PAYMENT_WEBHOOK_PROCESSED",
      entityType: "WebhookEvent",
      entityId: webhookRow.id,
    });

    return { status: "processed" };
  } catch (err) {
    await prisma.webhookEvent.update({
      where: { id: webhookRow.id },
      data: { status: "FAILED", processedAt: new Date() },
    });
    throw err;
  }
}
