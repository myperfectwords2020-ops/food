"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  changeAccountPasswordAction,
  requestAccountEmailChangeAction,
  updateAccountProfileAction,
} from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import type { AccountProfile } from "@/types/commerce";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(10),
});

type Values = z.infer<typeof schema>;

export function AccountProfileForm({ profile }: { profile: AccountProfile }) {
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
    },
  });
  const emailDraft = profile.email;
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  return (
    <div className="max-w-xl space-y-10">
      <form
        className="space-y-4"
        noValidate
        onSubmit={form.handleSubmit(async (values) => {
          const result = await updateAccountProfileAction(values);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success("Profile updated.");
          router.refresh();
        })}
      >
        <div className="form-grid">
          <label className="field" htmlFor="firstName">
            <span>First name</span>
            <input id="firstName" {...form.register("firstName")} />
          </label>
          <label className="field" htmlFor="lastName">
            <span>Last name</span>
            <input id="lastName" {...form.register("lastName")} />
          </label>
          <label className="field full" htmlFor="phone">
            <span>Phone</span>
            <input id="phone" {...form.register("phone")} />
          </label>
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Save profile
        </Button>
      </form>

      <section className="space-y-3 border-t border-border pt-6">
        <h2 className="text-sm font-bold">Email</h2>
        <p className="text-sm text-muted-foreground">Current: {emailDraft}</p>
        <label className="field full" htmlFor="newEmail">
          <span>New email</span>
          <input
            id="newEmail"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
        </label>
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            const result = await requestAccountEmailChangeAction(newEmail);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success(result.message);
          }}
        >
          Request email change
        </Button>
        <p className="text-xs text-muted-foreground">
          Email changes require verification. Delivery uses the notification service when
          configured.
        </p>
      </section>

      <section className="space-y-3 border-t border-border pt-6">
        <h2 className="text-sm font-bold">Password</h2>
        <label className="field full" htmlFor="currentPassword">
          <span>Current password</span>
          <input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </label>
        <label className="field full" htmlFor="newPassword">
          <span>New password</span>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </label>
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            const result = await changeAccountPasswordAction({
              currentPassword,
              newPassword,
            });
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success("Password updated.");
            setCurrentPassword("");
            setNewPassword("");
          }}
        >
          Change password
        </Button>
      </section>
    </div>
  );
}
