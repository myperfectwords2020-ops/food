/** Normalize phone for deduplication (Nigeria-friendly, E.164-ish). */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("234")) {
    digits = digits.slice(3);
  }
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  if (
    digits.length === 10 &&
    (digits.startsWith("7") || digits.startsWith("8") || digits.startsWith("9"))
  ) {
    return `234${digits}`;
  }
  if (digits.length >= 10 && digits.length <= 15) {
    return digits.startsWith("234") ? digits : `234${digits}`;
  }
  return digits.length >= 7 ? digits : null;
}

export function normalizeEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  return trimmed.includes("@") ? trimmed : null;
}

export function splitDisplayName(name: string): {
  firstName: string | null;
  lastName: string | null;
} {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: null, lastName: null };
  if (parts.length === 1) return { firstName: parts[0] ?? null, lastName: null };
  return {
    firstName: parts[0] ?? null,
    lastName: parts.slice(1).join(" ") || null,
  };
}

export function formatLeadName(
  firstName: string | null,
  lastName: string | null,
  fallback: string,
): string {
  const combined = [firstName, lastName].filter(Boolean).join(" ").trim();
  return combined || fallback;
}
