import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1).optional(),
  DIRECT_DATABASE_URL: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(32).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string().optional(),
  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_WEBHOOK_SECRET: z.string().optional(),
  AI_API_KEY: z.string().optional(),
  EMAIL_API_KEY: z.string().optional(),
  WHATSAPP_API_KEY: z.string().optional(),
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_REGION: z.string().optional(),
  STORAGE_PUBLIC_BASE_URL: z.string().url().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  DEFAULT_TENANT_SLUG: z.string().min(1).optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | null = null;

/** Validates env without logging secret values. Skips strict DB/Redis checks during `next build`. */
export function validateEnv(options?: { strict?: boolean }) {
  const strict = options?.strict ?? process.env["NODE_ENV"] === "production";
  const isBuild = process.env["NEXT_PHASE"] === "phase-production-build";

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = parsed.error.flatten().fieldErrors;
    throw new Error(`Invalid environment configuration: ${JSON.stringify(message)}`);
  }

  if (strict && !isBuild) {
    const missing: string[] = [];
    if (!parsed.data.DATABASE_URL) missing.push("DATABASE_URL");
    if (!parsed.data.AUTH_SECRET) missing.push("AUTH_SECRET");
    if (missing.length) {
      throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }
  }

  cached = parsed.data;
  return cached;
}

export function getEnv(): AppEnv {
  if (!cached) return validateEnv({ strict: false });
  return cached;
}
