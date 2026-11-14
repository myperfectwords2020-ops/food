import { getEnv } from "@/config/env";
import { ValidationError } from "@/lib/errors/app-error";

export type ResolvedStorageConfig = {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string | undefined;
  publicBaseUrl: string;
};

export function resolveStorageConfig(): ResolvedStorageConfig {
  const env = getEnv();
  const {
    STORAGE_BUCKET,
    STORAGE_REGION,
    STORAGE_ACCESS_KEY,
    STORAGE_SECRET_KEY,
    STORAGE_ENDPOINT,
    STORAGE_PUBLIC_BASE_URL,
  } = env;

  if (!STORAGE_BUCKET || !STORAGE_REGION || !STORAGE_ACCESS_KEY || !STORAGE_SECRET_KEY) {
    throw new ValidationError(
      "Product image storage is not configured. Set STORAGE_BUCKET, STORAGE_REGION, STORAGE_ACCESS_KEY, and STORAGE_SECRET_KEY in your environment.",
    );
  }

  const publicBaseUrl =
    env.STORAGE_PUBLIC_BASE_URL?.replace(/\/$/, "") ??
    `https://${STORAGE_BUCKET}.s3.${STORAGE_REGION}.amazonaws.com`;

  return {
    region: STORAGE_REGION,
    bucket: STORAGE_BUCKET,
    accessKeyId: STORAGE_ACCESS_KEY,
    secretAccessKey: STORAGE_SECRET_KEY,
    endpoint: STORAGE_ENDPOINT || undefined,
    publicBaseUrl,
  };
}
