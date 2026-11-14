/** Integer minor units (e.g. kobo for NGN). Never use floats for money. */

export function toMinorUnits(major: number, currency = "NGN"): number {
  if (!Number.isFinite(major) || major < 0) {
    throw new Error("Invalid monetary amount.");
  }
  const factor = currency === "NGN" ? 100 : 100;
  return Math.round(major * factor);
}

export function fromMinorUnits(minor: number, currency = "NGN"): number {
  if (!Number.isInteger(minor) || minor < 0) {
    throw new Error("Invalid minor unit amount.");
  }
  const factor = currency === "NGN" ? 100 : 100;
  return minor / factor;
}

export function addMinor(a: number, b: number): number {
  return a + b;
}

export function multiplyMinor(unitMinor: number, quantity: number): number {
  if (!Number.isInteger(quantity) || quantity < 0) throw new Error("Invalid quantity.");
  return unitMinor * quantity;
}
