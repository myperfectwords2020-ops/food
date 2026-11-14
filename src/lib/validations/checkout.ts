import { z } from "zod";

import { NIGERIA_STATE_CODES } from "@/lib/geo/nigeria-states";

export const checkoutSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(10, "Enter a valid phone number"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  street: z.string().min(3, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.enum(NIGERIA_STATE_CODES, { message: "Select a valid state" }),
  deliveryMethod: z.literal("standard"),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
