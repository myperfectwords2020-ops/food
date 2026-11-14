import { formatNaira } from "@/lib/format";
import type { CartSummary } from "@/types/commerce";

export function formatCheckoutDelivery(summary: CartSummary, stateSelected: boolean) {
  if (summary.delivery != null) return formatNaira(summary.delivery);
  if (summary.subtotal > 0 && stateSelected) return formatNaira(0);
  return "—";
}
