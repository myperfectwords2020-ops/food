import { afterEach, describe, expect, it, vi } from "vitest";

describe("environment validation", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("parses development env without strict requirements", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { validateEnv } = await import("@/config/env");
    expect(() => validateEnv({ strict: false })).not.toThrow();
  });

  it("fails strict production when DATABASE_URL missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", "");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("AUTH_SECRET", "x".repeat(32));
    const { validateEnv } = await import("@/config/env");
    expect(() => validateEnv({ strict: true })).toThrow(/DATABASE_URL/);
  });
});
