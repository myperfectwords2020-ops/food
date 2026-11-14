"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type InputHTMLAttributes } from "react";
import { useForm, useWatch } from "react-hook-form";

import { submitCheckoutAction } from "@/app/actions/commerce";
import { useCheckoutSummaryQuery } from "@/hooks/queries/use-checkout-summary";
import { PayWithPaystackButton } from "@/components/checkout/pay-with-paystack-button";
import { useCart } from "@/components/cart/cart-context";
import { NIGERIA_STATES } from "@/lib/geo/nigeria-states";
import { checkoutSchema, type CheckoutFormValues } from "@/lib/validations/checkout";
import { formatCheckoutDelivery } from "@/lib/checkout-display";
import { formatNaira } from "@/lib/format";
import type { CartSummary } from "@/types/commerce";

export function CheckoutForm() {
  const {
    lines,
    isLoading: cartLoading,
    bootstrapReady,
    clearCart,
  } = useCart({ includeSummary: false });
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentReady, setPaymentReady] = useState<{
    orderId: string;
    amount: number;
  } | null>(null);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: "",
      phone: "",
      firstName: "",
      lastName: "",
      street: "",
      city: "",
      state: "LA",
      deliveryMethod: "standard",
    },
  });

  const shippingState = useWatch({ control: form.control, name: "state" });
  const summaryQuery = useCheckoutSummaryQuery(shippingState, lines);
  const summary = summaryQuery.data;
  const summaryLoading = cartLoading || summaryQuery.isFetching;

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const result = await submitCheckoutAction(lines, values, idempotencyKey);
      if (!result.ok) {
        setSubmitError(result.error);
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            if (messages?.[0]) {
              form.setError(field as keyof CheckoutFormValues, { message: messages[0] });
            }
          }
        }
        return;
      }
      setPaymentReady({
        orderId: result.orderId,
        amount: result.summary.total,
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  const completeWithoutPayment = () => {
    if (!paymentReady) return;
    clearCart();
    router.push(`/order-confirmation?order=${paymentReady.orderId}`);
  };

  if (!bootstrapReady) {
    return (
      <p className="gc-checkout-summary-loading" role="status">
        Loading your bag…
      </p>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="gc-checkout-empty">
        <p>Your bag is empty.</p>
        <Link href="/shop" className="gc-btn gc-btn-green">
          Continue shopping
        </Link>
      </div>
    );
  }

  const displaySummary: CartSummary =
    summary ??
    ({
      lines: [],
      subtotal: 0,
      delivery: null,
      discount: 0,
      total: 0,
      currency: "NGN",
    } as const);

  return (
    <div className="checkout-layout gc-checkout-layout">
      <form className="gc-checkout-form" onSubmit={onSubmit} noValidate>
        <section className="gc-checkout-section" aria-labelledby="checkout-contact">
          <h2 id="checkout-contact">1. Contact information</h2>
          <div className="gc-checkout-grid">
            <Field
              label="Email address"
              id="email"
              error={form.formState.errors.email?.message}
              inputProps={{ type: "email", autoComplete: "email", ...form.register("email") }}
            />
            <Field
              label="Phone number"
              id="phone"
              error={form.formState.errors.phone?.message}
              inputProps={{ type: "tel", autoComplete: "tel", ...form.register("phone") }}
            />
            <Field
              label="First name"
              id="firstName"
              error={form.formState.errors.firstName?.message}
              inputProps={{ autoComplete: "given-name", ...form.register("firstName") }}
            />
            <Field
              label="Last name"
              id="lastName"
              error={form.formState.errors.lastName?.message}
              inputProps={{ autoComplete: "family-name", ...form.register("lastName") }}
            />
          </div>
        </section>

        <section className="gc-checkout-section" aria-labelledby="checkout-address">
          <h2 id="checkout-address">2. Delivery address</h2>
          <div className="gc-checkout-grid">
            <Field
              label="Street address"
              id="street"
              full
              error={form.formState.errors.street?.message}
              inputProps={{ autoComplete: "street-address", ...form.register("street") }}
            />
            <Field
              label="City"
              id="city"
              error={form.formState.errors.city?.message}
              inputProps={{ autoComplete: "address-level2", ...form.register("city") }}
            />
            <div className="gc-checkout-field">
              <label htmlFor="state">State</label>
              <select id="state" className="gc-checkout-input" {...form.register("state")}>
                {NIGERIA_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.state?.message ? (
                <span className="gc-checkout-error" role="alert">
                  {form.formState.errors.state.message}
                </span>
              ) : null}
            </div>
          </div>
        </section>

        <section className="gc-checkout-section" aria-labelledby="checkout-delivery">
          <h2 id="checkout-delivery">3. Delivery method</h2>
          <label className="gc-checkout-radio">
            <input type="radio" value="standard" {...form.register("deliveryMethod")} />
            <span className="gc-checkout-radio-body">
              <strong>Standard delivery</strong>
              <small>2–4 business days · fee based on your state</small>
            </span>
          </label>
        </section>

        {submitError ? (
          <p className="gc-checkout-alert" role="alert">
            {submitError}
          </p>
        ) : null}

        {!paymentReady ? (
          <button
            type="submit"
            className="gc-btn gc-btn-green gc-checkout-submit"
            disabled={isSubmitting || summaryLoading || !summary?.lines.length}
          >
            {isSubmitting ? "Preparing checkout…" : "Continue to payment"}{" "}
            <LockKeyhole size={15} aria-hidden />
          </button>
        ) : (
          <div className="gc-checkout-payment-panel" aria-live="polite">
            <h2>Payment · Paystack</h2>
            <p>
              Order <strong>{paymentReady.orderId}</strong> · Amount due{" "}
              <strong>{formatNaira(paymentReady.amount)}</strong> (verified on our servers).
            </p>
            <p className="gc-checkout-payment-note">
              You will be redirected to Paystack. The charge amount is set on our servers and
              confirmed before your order is marked paid.
            </p>
            <PayWithPaystackButton
              orderId={paymentReady.orderId}
              onBeforeRedirect={() => clearCart()}
            />
            <button
              type="button"
              className="gc-btn gc-btn-outline gc-checkout-secondary"
              onClick={completeWithoutPayment}
            >
              View order summary (payment pending)
            </button>
          </div>
        )}

        <p className="gc-checkout-footnote">
          Totals and inventory are validated on the server before payment.
        </p>
      </form>

      <aside className="order-summary gc-checkout-summary" aria-live="polite">
        <h2>Your order</h2>
        {summaryLoading ? (
          <p className="gc-checkout-summary-loading">Calculating your totals…</p>
        ) : null}
        {summaryQuery.isError ? (
          <p className="gc-checkout-alert" role="alert">
            We could not refresh your order total. Please try again in a moment.
          </p>
        ) : null}
        <div className="gc-checkout-line-items">
          {displaySummary.lines.map((line) => (
            <div className="summary-line gc-summary-line" key={line.productId}>
              <span>
                {line.name} × {line.quantity}
              </span>
              <span>{formatNaira(line.lineTotal)}</span>
            </div>
          ))}
        </div>
        <div className="summary-line gc-summary-line">
          <span>Subtotal</span>
          <span>{formatNaira(displaySummary.subtotal)}</span>
        </div>
        <div className="summary-line gc-summary-line">
          <span>Delivery</span>
          <span>{formatCheckoutDelivery(displaySummary, Boolean(shippingState))}</span>
        </div>
        {displaySummary.discount > 0 ? (
          <div className="summary-line gc-summary-line">
            <span>Discount</span>
            <span>-{formatNaira(displaySummary.discount)}</span>
          </div>
        ) : null}
        <div className="summary-line total gc-summary-line gc-summary-total">
          <span>Total</span>
          <span>
            {displaySummary.total > 0
              ? formatNaira(displaySummary.total)
              : formatNaira(displaySummary.subtotal)}
          </span>
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  id,
  error,
  full,
  inputProps,
}: {
  label: string;
  id: string;
  error?: string | undefined;
  full?: boolean;
  inputProps: InputHTMLAttributes<HTMLInputElement>;
}) {
  return (
    <div className={`gc-checkout-field ${full ? "gc-checkout-field-full" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <input id={id} className="gc-checkout-input" {...inputProps} />
      {error ? (
        <span className="gc-checkout-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
