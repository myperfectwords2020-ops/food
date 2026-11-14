"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updateAccountPreferencesAction } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import type { AccountPreferences } from "@/types/commerce";

const schema = z.object({
  emailOffers: z.boolean(),
  smsUpdates: z.boolean(),
  whatsappOffers: z.boolean(),
  fragranceFree: z.boolean(),
  routineReminders: z.boolean(),
  communicationChannel: z.enum(["email", "sms", "whatsapp"]),
});

type Values = z.infer<typeof schema>;

const fields: {
  key: keyof Pick<
    Values,
    "emailOffers" | "smsUpdates" | "whatsappOffers" | "fragranceFree" | "routineReminders"
  >;
  label: string;
  marketing?: boolean;
}[] = [
  { key: "emailOffers", label: "Email offers and ritual notes (marketing)", marketing: true },
  { key: "smsUpdates", label: "SMS delivery updates (transactional)" },
  { key: "whatsappOffers", label: "WhatsApp offers (marketing)", marketing: true },
  { key: "fragranceFree", label: "Prefer fragrance-free formulas" },
  { key: "routineReminders", label: "Routine reminder nudges" },
];

export function AccountPreferencesForm({ preferences }: { preferences: AccountPreferences }) {
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      emailOffers: preferences.emailOffers,
      smsUpdates: preferences.smsUpdates,
      whatsappOffers: preferences.whatsappOffers,
      fragranceFree: preferences.fragranceFree,
      routineReminders: preferences.routineReminders,
      communicationChannel: preferences.communicationChannel ?? "email",
    },
  });

  return (
    <form
      className="max-w-xl space-y-4"
      noValidate
      onSubmit={form.handleSubmit(async (values) => {
        const result = await updateAccountPreferencesAction(values);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Preferences saved.");
        router.refresh();
      })}
    >
      {fields.map(({ key, label }) => (
        <label key={key} className="flex items-center gap-3 text-sm">
          <input type="checkbox" {...form.register(key)} />
          {label}
        </label>
      ))}
      <label className="field" htmlFor="communicationChannel">
        <span>Preferred channel</span>
        <select id="communicationChannel" {...form.register("communicationChannel")}>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
      </label>
      <Button type="submit" disabled={form.formState.isSubmitting}>
        Save preferences
      </Button>
      <p className="text-xs text-muted-foreground">
        Marketing options are off by default until you opt in. Order and delivery messages are
        separate from promotional email.
      </p>
    </form>
  );
}
