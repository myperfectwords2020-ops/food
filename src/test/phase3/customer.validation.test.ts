import { describe, expect, it } from "vitest";

import {
  addressInputSchema,
  updatePreferencesSchema,
  updateProfileSchema,
} from "@/modules/customers/customer.validation";

describe("customer validation", () => {
  it("normalizes profile phone whitespace", () => {
    const parsed = updateProfileSchema.parse({
      firstName: " Ada ",
      lastName: "Okoye",
      phone: "+234 803 555 0148",
    });
    expect(parsed.firstName).toBe("Ada");
    expect(parsed.phone).toContain("+234");
  });

  it("requires address core fields", () => {
    expect(() =>
      addressInputSchema.parse({
        firstName: "A",
        lastName: "B",
        phone: "+2348035550148",
        street: "",
        city: "Lagos",
        state: "LA",
      }),
    ).toThrow();
  });

  it("accepts preference toggles", () => {
    const parsed = updatePreferencesSchema.parse({
      emailOffers: false,
      smsUpdates: true,
      whatsappOffers: false,
      fragranceFree: true,
      routineReminders: true,
    });
    expect(parsed.smsUpdates).toBe(true);
  });
});
