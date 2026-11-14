import { getEnv } from "@/config/env";

export function getAiLimits() {
  const env = getEnv();
  return {
    maxToolCallsPerTurn: 5,
    maxOrchestrationSteps: 8,
    maxContextMessages: 20,
    maxMessageLength: 2000,
    maxToolOutputChars: 12_000,
    timeoutMs: Number(process.env["AI_TIMEOUT_MS"] ?? 25_000),
    model: process.env["AI_MODEL"] ?? "gpt-4o-mini",
    temperature: 0.4,
    maxOutputTokens: 1200,
    anonymousRateLimit: { limit: 20, windowSeconds: 3600 },
    authenticatedRateLimit: { limit: 60, windowSeconds: 3600 },
    hasProviderKey: Boolean(env.AI_API_KEY),
  };
}
