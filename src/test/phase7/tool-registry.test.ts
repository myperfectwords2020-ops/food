import { describe, expect, it } from "vitest";

import { TOOL_REGISTRY, getToolByName } from "@/modules/ai/tools/tool-registry";
import { assertToolAuth } from "@/modules/ai/tools/tool-auth";
import { AuthorizationError } from "@/lib/errors/app-error";

describe("AI tool registry", () => {
  it("registers required tools", () => {
    const names = TOOL_REGISTRY.map((t) => t.name);
    expect(names).toContain("searchProducts");
    expect(names).toContain("getRecommendations");
    expect(names).toContain("addProductToCart");
    expect(names).toContain("createLead");
  });

  it("blocks authenticated tools for anonymous users", () => {
    expect(() =>
      assertToolAuth("authenticated", {
        tenantId: "t1",
        conversationId: "c1",
        requestId: "r1",
        role: "ANONYMOUS",
      }),
    ).toThrow(AuthorizationError);
  });

  it("allows public tools", () => {
    expect(getToolByName("searchProducts")?.auth).toBe("public");
  });
});
