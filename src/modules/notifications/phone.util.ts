/** Normalize to E.164-ish digits for WhatsApp (default NG country if local). */
export function normalizePhoneNumber(raw: string, defaultCountry = "234"): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return null;
  if (digits.startsWith("0")) return `${defaultCountry}${digits.slice(1)}`;
  if (digits.length === 10 && defaultCountry === "234") return `${defaultCountry}${digits}`;
  return digits;
}
