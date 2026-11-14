import { createS3StorageService } from "@/lib/storage/s3-storage.service";
import { resolveStorageConfig } from "@/lib/storage/storage-config";
import type { StorageService } from "@/lib/storage/storage.service";

let cached: StorageService | null = null;

export function getStorageService(): StorageService {
  if (!cached) {
    cached = createS3StorageService(resolveStorageConfig());
  }
  return cached;
}
