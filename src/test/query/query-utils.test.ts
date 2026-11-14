import { describe, expect, it } from "vitest";

import { getQueryErrorMessage, shouldRetryQueryFailure } from "@/lib/query/query-utils";

describe("shouldRetryQueryFailure", () => {
  it("does not retry auth and validation errors", () => {
    expect(shouldRetryQueryFailure({ status: 401 })).toBe(false);
    expect(shouldRetryQueryFailure({ status: 403 })).toBe(false);
    expect(shouldRetryQueryFailure({ status: 404 })).toBe(false);
    expect(shouldRetryQueryFailure({ status: 422 })).toBe(false);
  });

  it("retries unknown errors", () => {
    expect(shouldRetryQueryFailure(new Error("network"))).toBe(true);
  });
});

describe("getQueryErrorMessage", () => {
  it("uses Error message when present", () => {
    expect(getQueryErrorMessage(new Error("Bad request"))).toBe("Bad request");
  });

  it("falls back for non-errors", () => {
    expect(getQueryErrorMessage(null)).toBe("Something went wrong.");
  });
});
