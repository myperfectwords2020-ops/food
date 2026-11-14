export type UploadObjectInput = {
  tenantId: string;
  key: string;
  contentType: string;
  sizeBytes: number;
  body: Buffer;
};

export type UploadObjectResult = {
  url: string;
  key: string;
};

/** S3-compatible storage abstraction — implementation in a later phase. */
export interface StorageService {
  putObject(input: UploadObjectInput): Promise<UploadObjectResult>;
  deleteObject(tenantId: string, key: string): Promise<void>;
  getSignedUploadUrl(tenantId: string, key: string, contentType: string): Promise<string>;
}

export const UploadLimits = {
  maxBytes: 5 * 1024 * 1024,
  allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
} as const;
