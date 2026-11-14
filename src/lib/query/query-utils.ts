import type { CartLineInput } from "@/types/commerce";

/** Stable cache key segment for cart line arrays. */
export function cartLinesKey(lines: CartLineInput[]): string {
  if (lines.length === 0) return "empty";
  return [...lines]
    .sort((a, b) => a.productId.localeCompare(b.productId))
    .map((l) => `${l.productId}:${l.quantity}`)
    .join("|");
}

export function shouldRetryQueryFailure(error: unknown): boolean {
  if (!error || typeof error !== "object") return true;
  const status =
    "status" in error && typeof (error as { status: unknown }).status === "number"
      ? (error as { status: number }).status
      : undefined;
  if (status === 401 || status === 403 || status === 404 || status === 422 || status === 409) {
    return false;
  }
  if (status === 429) return false;
  return true;
}

export function getQueryErrorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
