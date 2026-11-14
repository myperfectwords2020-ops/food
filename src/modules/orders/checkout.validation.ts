import { z } from "zod";

import { NIGERIA_STATE_CODES } from "@/lib/geo/nigeria-states";

export const checkoutInputSchema = z.object({
  email: z
    .string()
    .email()
    .transform((e) => e.trim().toLowerCase()),
  phone: z.string().min(10).max(32),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  street: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(80),
  state: z.enum(NIGERIA_STATE_CODES),
  postalCode: z.string().max(20).optional(),
  country: z.string().length(2).optional(),
  deliveryMethod: z.literal("standard"),
});

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
