import { authorizeAny } from "@/lib/auth/authorize-context";
import type { RequestContext } from "@/lib/auth/types";
import { ValidationError } from "@/lib/errors/app-error";
import { getStorageService } from "@/lib/storage/get-storage-service";
import {
  buildProductImageObjectKey,
  extensionForContentType,
} from "@/lib/storage/product-image-keys";
import { UploadLimits } from "@/lib/storage/storage.service";

export type UploadedProductImage = {
  url: string;
  storageKey: string;
};

export async function uploadAdminProductImage(
  context: RequestContext,
  file: File,
): Promise<UploadedProductImage> {
  authorizeAny(context, "products.create", "products.update");

  const tenantId = context.tenantId;
  if (!tenantId) throw new ValidationError("Tenant required.");

  if (
    !UploadLimits.allowedContentTypes.includes(
      file.type as (typeof UploadLimits.allowedContentTypes)[number],
    )
  ) {
    throw new ValidationError("Use a JPEG, PNG, or WebP image.");
  }

  if (file.size <= 0 || file.size > UploadLimits.maxBytes) {
    throw new ValidationError(`Image must be at most ${UploadLimits.maxBytes / (1024 * 1024)} MB.`);
  }

  if (!extensionForContentType(file.type)) {
    throw new ValidationError("Unsupported image type.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = buildProductImageObjectKey(tenantId, file.type);
  const storage = getStorageService();
  const result = await storage.putObject({
    tenantId,
    key: storageKey,
    contentType: file.type,
    sizeBytes: file.size,
    body: buffer,
  });

  return { url: result.url, storageKey: result.key };
}
