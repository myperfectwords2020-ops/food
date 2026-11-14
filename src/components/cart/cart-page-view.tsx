"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";

import { useCart } from "@/components/cart/cart-context";
import { EmptyState } from "@/components/page-ui";
import { RouteLink } from "@/components/ui/route-link";
import { formatNaira } from "@/lib/format";

export function CartPageView() {
  const { summary, isLoading, setQuantity, removeItem, itemCount } = useCart();

  if (!isLoading && summary.lines.length === 0) {
    return (
      <div className="page-shell">
        <EmptyState
          title="Your bag is empty"
          copy="Explore the collection and add products you love."
        />
        <RouteLink href="/shop" className="mt-6 inline-flex">
          Continue shopping
        </RouteLink>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <h1 className="page-title mb-10">
        Your bag <small className="font-sans text-base">({itemCount})</small>
      </h1>
      {isLoading ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Updating your bag…
        </p>
      ) : null}
      <div className="cart-layout">
        <div>
          {summary.lines.map((line) => (
            <div className="cart-item" key={line.productId}>
              <Image src={line.image} alt={line.name} width={100} height={120} />
              <div>
                <p className="eyebrow">Product</p>
                <h3>{line.name}</h3>
                <div className="quantity w-28 h-10">
                  <button
                    type="button"
                    aria-label={`Decrease quantity of ${line.name}`}
                    onClick={() => setQuantity(line.productId, line.quantity - 1)}
                  >
                    <Minus size={13} />
                  </button>
                  <span aria-live="polite">{line.quantity}</span>
                  <button
                    type="button"
                    aria-label={`Increase quantity of ${line.name}`}
                    onClick={() =>
                      setQuantity(line.productId, Math.min(line.maxQuantity, line.quantity + 1))
                    }
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
              <div>
                <strong>{formatNaira(line.lineTotal)}</strong>
                <button
                  type="button"
                  aria-label={`Remove ${line.name} from bag`}
                  className="block ml-auto mt-8"
                  onClick={() => removeItem(line.productId)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <aside className="order-summary">
          <h2>Order summary</h2>
          <div className="summary-line">
            <span>Subtotal</span>
            <span>{formatNaira(summary.subtotal)}</span>
          </div>
          <div className="summary-line">
            <span>Delivery</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="summary-line">
            <span>Discount</span>
            <span>{summary.discount ? formatNaira(summary.discount) : "—"}</span>
          </div>
          <div className="summary-line total">
            <span>Total</span>
            <span>{formatNaira(summary.subtotal)}</span>
          </div>
          <RouteLink href="/checkout" className="w-full mt-4 inline-flex">
            Proceed to checkout
          </RouteLink>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Secure checkout · Delivery across Nigeria
          </p>
        </aside>
      </div>
    </div>
  );
}
