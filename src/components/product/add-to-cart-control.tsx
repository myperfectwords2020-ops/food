"use client";

import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { recordStorefrontAddToCartAction } from "@/app/actions/analytics-events";
import { useCart } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/format";

export function AddToCartControl({
  productId,
  unitPrice,
  maxQuantity,
  compact = false,
  showBuyNow = false,
}: {
  productId: string;
  unitPrice: number;
  maxQuantity: number;
  compact?: boolean;
  showBuyNow?: boolean;
}) {
  const router = useRouter();
  const { lines, setQuantity } = useCart({ includeSummary: false });

  const cartQuantity = useMemo(
    () => lines.find((l) => l.productId === productId)?.quantity ?? 0,
    [lines, productId],
  );

  const [qty, setQty] = useState(1);

  // When cart loads or you open another product, mirror the quantity already in the bag.
  useEffect(() => {
    setQty(cartQuantity > 0 ? cartQuantity : 1);
  }, [productId, cartQuantity]);

  const inBag = cartQuantity > 0;

  const handleApply = () => {
    setQuantity(productId, qty);
    void recordStorefrontAddToCartAction({ productId });
  };

  const handleBuyNow = () => {
    setQuantity(productId, qty);
    router.push("/checkout");
  };

  return (
    <>
    <div className={compact ? "flex flex-col gap-2" : "purchase-row"}>
      <div className="quantity">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => setQty(Math.max(1, qty - 1))}
        >
          <Minus size={14} />
        </button>
        <span aria-live="polite">{qty}</span>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => setQty(Math.min(maxQuantity, qty + 1))}
        >
          <Plus size={14} />
        </button>
      </div>
      <Button type="button" onClick={handleApply}>
        {inBag && qty === cartQuantity
          ? `${cartQuantity} in bag · ${formatNaira(unitPrice * cartQuantity)}`
          : inBag
            ? `Update bag · ${formatNaira(unitPrice * qty)}`
            : `Add to bag · ${formatNaira(unitPrice * qty)}`}
      </Button>
    </div>
    {showBuyNow ? (
      <div className="flex gap-2 mt-3">
        <Button type="button" variant="outline" className="flex-1" onClick={handleBuyNow}>
          Buy now
        </Button>
      </div>
    ) : null}
    </>
  );
}
