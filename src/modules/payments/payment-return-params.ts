/** Paystack appends `reference` and `trxref`; avoid duplicating them in callback_url. */
export function paymentReferenceFromSearchParams(searchParams: {
  reference?: string | string[] | undefined;
  trxref?: string | string[] | undefined;
}): string | undefined {
  const one = (value?: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const ref = one(searchParams.reference)?.trim();
  if (ref) return ref;
  return one(searchParams.trxref)?.trim();
}
