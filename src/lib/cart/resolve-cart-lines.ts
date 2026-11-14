import type { CartLineInput } from "@/types/commerce";

/** Until guest lines are merged, keep showing them when the logged-in server cart is still empty. */
export function resolveCartLines(
  serverCart: boolean,
  serverLines: CartLineInput[] | undefined,
  guestLines: CartLineInput[],
): CartLineInput[] {
  if (serverCart && serverLines) {
    if (serverLines.length > 0 || guestLines.length === 0) {
      return serverLines;
    }
    return guestLines;
  }
  return guestLines;
}
