/** Interactive transaction limits for remote PostgreSQL (e.g. Neon). */
export const checkoutTransactionOptions = {
  maxWait: 10_000,
  timeout: 30_000,
} as const;

/** Conversation writes (often follow long AI calls — need longer pool wait). */
export const conversationTransactionOptions = {
  maxWait: 15_000,
  timeout: 20_000,
} as const;
