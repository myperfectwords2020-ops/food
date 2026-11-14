import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import type { ResolvedStorageConfig } from "@/lib/storage/storage-config";
import type {
  StorageService,
  UploadObjectInput,
  UploadObjectResult,
} from "@/lib/storage/storage.service";

function createClient(config: ResolvedStorageConfig): S3Client {
  return new S3Client({
    region: config.region,
    ...(config.endpoint ? { endpoint: config.endpoint, forcePathStyle: true } : {}),
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export function createS3StorageService(config: ResolvedStorageConfig): StorageService {
  const client = createClient(config);

  return {
    async putObject(input: UploadObjectInput): Promise<UploadObjectResult> {
      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: input.key,
          Body: input.body,
          ContentType: input.contentType,
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );

      const url = `${config.publicBaseUrl}/${input.key}`;
      return { url, key: input.key };
    },

    async deleteObject(_tenantId: string, key: string): Promise<void> {
      await client.send(
        new DeleteObjectCommand({
          Bucket: config.bucket,
          Key: key,
        }),
      );
    },

    async getSignedUploadUrl(): Promise<string> {
      throw new Error(
        "Direct signed uploads are not enabled. Use server-side product image upload.",
      );
    },
  };
}
