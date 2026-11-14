import type { CartLineInput } from "@/types/commerce";

export const GUEST_CART_STORAGE_KEY = "elanskin_cart_v1";

export function readGuestCartLines(): CartLineInput[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLineInput[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeGuestCartLines(next: CartLineInput[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(next));
}

export function clearGuestCartStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_CART_STORAGE_KEY);
}

/** Skip cart server round-trips when the browser has no Auth.js session cookie. */
export function hasLikelyAuthSession(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((part) => {
    const name = part.trim().split("=")[0] ?? "";
    return (
      name === "authjs.session-token" ||
      name === "__Secure-authjs.session-token" ||
      name === "next-auth.session-token" ||
      name === "__Secure-next-auth.session-token"
    );
  });
}
