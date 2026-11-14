import { z } from "zod";

const phoneSchema = z
  .string()
  .min(10, "Enter a valid phone number.")
  .max(32)
  .transform((v) => v.replace(/\s+/g, " ").trim());

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1)
    .max(80)
    .transform((s) => s.trim()),
  lastName: z
    .string()
    .min(1)
    .max(80)
    .transform((s) => s.trim()),
  phone: phoneSchema,
});

export const requestEmailChangeSchema = z.object({
  newEmail: z
    .string()
    .email()
    .transform((e) => e.trim().toLowerCase()),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8).max(128),
});

export const addressInputSchema = z.object({
  label: z.string().max(40).optional(),
  firstName: z
    .string()
    .min(1)
    .max(80)
    .transform((s) => s.trim()),
  lastName: z
    .string()
    .min(1)
    .max(80)
    .transform((s) => s.trim()),
  phone: phoneSchema,
  street: z
    .string()
    .min(1)
    .max(200)
    .transform((s) => s.trim()),
  line2: z
    .string()
    .max(200)
    .optional()
    .transform((s) => s?.trim() || undefined),
  city: z
    .string()
    .min(1)
    .max(80)
    .transform((s) => s.trim()),
  state: z
    .string()
    .min(1)
    .max(80)
    .transform((s) => s.trim()),
  postalCode: z
    .string()
    .max(20)
    .optional()
    .transform((s) => s?.trim() || undefined),
  country: z.string().length(2).default("NG"),
  isDefault: z.boolean().optional(),
});

export const skinProfileSchema = z.object({
  skinType: z.string().max(40).optional(),
  concerns: z.array(z.string().max(80)).max(12).optional(),
  sensitivities: z.array(z.string().max(80)).max(12).optional(),
  goals: z.array(z.string().max(80)).max(12).optional(),
  fragrancePreference: z.string().max(80).optional(),
  routineComplexity: z.string().max(80).optional(),
  budgetPreference: z.string().max(80).optional(),
});

export const updatePreferencesSchema = z.object({
  emailOffers: z.boolean(),
  smsUpdates: z.boolean(),
  whatsappOffers: z.boolean(),
  fragranceFree: z.boolean(),
  routineReminders: z.boolean(),
  communicationChannel: z.enum(["email", "sms", "whatsapp"]).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddressInput = z.infer<typeof addressInputSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type SkinProfile = z.infer<typeof skinProfileSchema>;
