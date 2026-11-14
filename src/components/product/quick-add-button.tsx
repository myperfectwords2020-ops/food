"use client";

import { Plus, ShoppingBag, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";

import {
  recordAssistantAddToCartAction,
  recordStorefrontAddToCartAction,
} from "@/app/actions/analytics-events";
import { useCart } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";

export function QuickAddButton({
  productId,
  analyticsSource = "storefront",
  conversationId,
  iconOnly = false,
  disabled = false,
  label,
  productName,
}: {
  productId: string;
  analyticsSource?: "storefront" | "assistant";
  conversationId?: string;
  iconOnly?: boolean;
  disabled?: boolean;
  /** Visible text for a compact cart button, e.g. "Add". */
  label?: string;
  /** Included in the accessible name when several labelled buttons share a page. */
  productName?: string;
}) {
  const { addItem, lines } = useCart({ includeSummary: false });
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const line = lines.find((l) => l.productId === productId);
    setAdded(Boolean(line && line.quantity > 0));
  }, [lines, productId]);

  return (
    <Button
      type="button"
      variant="secondary"
      className="quick-add"
      disabled={disabled}
      aria-label={
        iconOnly
          ? added
            ? "Added to bag"
            : "Add to bag"
          : label && productName
            ? `${added ? "Added" : label} ${productName} to cart`
            : undefined
      }
      onClick={() => {
        addItem(productId, 1);
        if (analyticsSource === "assistant") {
          void recordAssistantAddToCartAction(
            conversationId ? { productId, conversationId } : { productId },
          );
        } else {
          void recordStorefrontAddToCartAction({ productId });
        }
      }}
    >
      {iconOnly ? (
        <ShoppingBag size={14} aria-hidden />
      ) : label ? (
        <>
          <ShoppingCart size={14} aria-hidden />
          {added ? "Added" : label}
        </>
      ) : (
        <>
          <Plus size={16} aria-hidden />
          {added ? "Added" : "Quick add"}
        </>
      )}
    </Button>
  );
}
