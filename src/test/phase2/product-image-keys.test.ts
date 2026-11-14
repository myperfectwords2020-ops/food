import { describe, expect, it } from "vitest";

import {
  buildProductImageObjectKey,
  extensionForContentType,
} from "@/lib/storage/product-image-keys";

describe("product image object keys", () => {
  it("maps allowed content types to extensions", () => {
    expect(extensionForContentType("image/jpeg")).toBe("jpg");
    expect(extensionForContentType("image/png")).toBe("png");
  });

  it("builds tenant-scoped keys", () => {
    const key = buildProductImageObjectKey("tenant-1", "image/webp");
    expect(key).toMatch(/^tenants\/tenant-1\/product-images\/[a-f0-9-]+\.webp$/);
  });
});
