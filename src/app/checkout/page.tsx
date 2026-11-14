import { redirect } from "next/navigation";

import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getSessionUser } from "@/lib/auth/index";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Checkout",
  "Complete your Greencart delivery details and review your order.",
);

export default async function CheckoutPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "CUSTOMER") {
    redirect("/account/login?callbackUrl=/checkout");
  }
  return (
    <section className="gc-checkout-page" aria-labelledby="checkout-heading">
      <div className="gc-wrap">
        <header className="gc-checkout-header">
          <p className="gc-checkout-eyebrow">Secure checkout</p>
          <h1 id="checkout-heading">Review and pay</h1>
          <p className="gc-checkout-lede">
            Confirm your contact details and delivery address. Totals and delivery fees are
            calculated on our servers before you pay.
          </p>
        </header>
        <CheckoutForm />
      </div>
    </section>
  );
}
