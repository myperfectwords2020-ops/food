import type { LeadSource } from "@prisma/client";

export type LeadScoreResult = {
  score: number;
  reasons: string[];
  suggestedStatus: "QUALIFIED" | "NEW";
};

type ScoreInput = {
  email: string | null;
  phone: string | null;
  source: LeadSource;
  concern?: string | null | undefined;
  interest?: string | null | undefined;
  routineCompleted?: boolean | undefined;
  checkoutStarted?: boolean | undefined;
  hasExistingCustomer?: boolean | undefined;
  marketingOptIn?: boolean | undefined;
};

export function scoreLead(input: ScoreInput): LeadScoreResult {
  let score = 0;
  const reasons: string[] = [];

  if (input.email) {
    score += 15;
    reasons.push("Valid email provided");
  }
  if (input.phone) {
    score += 20;
    reasons.push("Valid phone provided");
  }
  if (input.concern?.trim()) {
    score += 10;
    reasons.push("Skin concern captured");
  }
  if (input.interest?.trim()) {
    score += 10;
    reasons.push("Product interest captured");
  }
  if (input.routineCompleted) {
    score += 25;
    reasons.push("Routine questionnaire completed");
  }
  if (input.checkoutStarted) {
    score += 20;
    reasons.push("Checkout initiated");
  }
  if (input.hasExistingCustomer) {
    score += 10;
    reasons.push("Linked to existing customer record");
  }
  if (input.source === "CONTACT_FORM" || input.source === "ROUTINE") {
    score += 5;
    reasons.push("High-intent acquisition channel");
  }
  if (input.marketingOptIn) {
    score += 5;
    reasons.push("Explicit marketing consent");
  }

  const suggestedStatus = score >= 55 ? "QUALIFIED" : "NEW";
  return { score: Math.min(score, 100), reasons, suggestedStatus };
}
