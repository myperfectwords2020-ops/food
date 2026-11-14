import { describe, expect, it } from "vitest";

import { AppError, normalizeError, ValidationError } from "@/lib/errors/app-error";

describe("application errors", () => {
  it("maps validation errors to 400 and exposes message", () => {
    const err = new ValidationError("Invalid email", { field: "email" });
    expect(err.status).toBe(400);
    expect(err.toJSON().error.message).toBe("Invalid email");
  });

  it("hides internal errors in JSON", () => {
    const err = new AppError("INTERNAL_ERROR", "db exploded", { expose: false });
    expect(err.toJSON().error.message).toBe("An unexpected error occurred.");
  });

  it("normalizes unknown errors", () => {
    const err = normalizeError(new Error("oops"));
    expect(err.code).toBe("INTERNAL_ERROR");
    expect(err.expose).toBe(false);
  });
});
