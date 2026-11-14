import { randomUUID } from "crypto";

const extByContentType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function extensionForContentType(contentType: string): string | null {
  return extByContentType[contentType] ?? null;
}

/** Tenant-scoped object key for catalog images in S3. */
export function buildProductImageObjectKey(tenantId: string, contentType: string): string {
  const ext = extensionForContentType(contentType);
  if (!ext) {
    throw new Error("Unsupported image type.");
  }
  return `tenants/${tenantId}/product-images/${randomUUID()}.${ext}`;
}
