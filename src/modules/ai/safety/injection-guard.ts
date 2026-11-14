const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /system\s+prompt/i,
  /show\s+(me\s+)?(your\s+)?(api\s+key|secret|password)/i,
  /\b(api\s*key|secret\s*key|auth\s*secret)\b/i,
  /\b(run|execute)\s+(sql|query|shell|command)\b/i,
  /\b(prisma|postgres|redis)\b/i,
  /jailbreak/i,
  /developer\s+mode/i,
];

const URGENT_MEDICAL = [
  /difficulty breathing/i,
  /can't breathe/i,
  /anaphylaxis/i,
  /throat\s+closing/i,
  /severe\s+swelling/i,
  /facial\s+swelling/i,
  /swollen\s+(lips?|tongue|throat|face)/i,
  /(can't|cannot|trouble|difficulty)\s+swallow/i,
  /\bepi-?pen\b/i,
];

export function isPromptInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(text));
}

export function isUrgentMedicalConcern(text: string): boolean {
  return URGENT_MEDICAL.some((p) => p.test(text));
}
