import { describe, expect, it, beforeAll } from "vitest";

import {
  createMarketingUnsubscribeToken,
  verifyMarketingUnsubscribeToken,
} from "@/modules/notifications/unsubscribe-token.service";

describe("marketing unsubscribe token", () => {
  beforeAll(() => {
    process.env["AUTH_SECRET"] = "test-secret-key-at-least-32-characters-long";
  });

  it("round-trips valid token", () => {
    const token = createMarketingUnsubscribeToken({
      tenantId: "t1",
      customerId: "c1",
      channel: "EMAIL",
    });
    const parsed = verifyMarketingUnsubscribeToken(token);
    expect(parsed?.customerId).toBe("c1");
  });

  it("rejects tampered token", () => {
    const token = createMarketingUnsubscribeToken({
      tenantId: "t1",
      customerId: "c1",
      channel: "EMAIL",
    });
    expect(verifyMarketingUnsubscribeToken(`${token}x`)).toBeNull();
  });
});
