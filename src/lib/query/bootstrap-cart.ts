import { fetchCustomerCartAction, mergeLocalCartAction } from "@/app/actions/cart";
import {
  clearGuestCartStorage,
  hasLikelyAuthSession,
  readGuestCartLines,
  writeGuestCartLines,
} from "@/lib/query/guest-cart-storage";
import type { CartLineInput, CartSummary } from "@/types/commerce";

export type CartBootstrapResult =
  | { mode: "server"; lines: CartLineInput[]; summary: CartSummary }
  | { mode: "guest"; lines: CartLineInput[] };

export { readGuestCartLines, writeGuestCartLines, clearGuestCartStorage };

/** One-time cart hydration (guest localStorage or logged-in server cart). */
export async function bootstrapCartSession(): Promise<CartBootstrapResult> {
  const local = readGuestCartLines();

  // Guests without a session cookie avoid a slow server action on every page load.
  if (!hasLikelyAuthSession()) {
    return { mode: "guest", lines: local };
  }

  const remote = await fetchCustomerCartAction();

  if (remote) {
    if (local.length) {
      await mergeLocalCartAction(local);
      clearGuestCartStorage();
      const refreshed = await fetchCustomerCartAction();
      if (refreshed) {
        return { mode: "server", lines: refreshed.lines, summary: refreshed.summary };
      }
    }
    return { mode: "server", lines: remote.lines, summary: remote.summary };
  }

  return { mode: "guest", lines: local };
}
