"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTransition } from "react";

import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

type Props = {
  variant?: "inline" | "header" | "nav";
};

export function SignOutButton({ variant = "inline" }: Props) {
  const queryClient = useQueryClient();
  const [pending, startTransition] = useTransition();

  const className =
    variant === "header"
      ? "text-sm font-bold underline px-0 h-auto min-h-0 bg-transparent hover:bg-transparent"
      : variant === "nav"
        ? "w-full justify-start font-bold"
        : "text-sm font-bold underline";

  return (
    <Button
      type="button"
      variant="ghost"
      className={className}
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          queryClient.clear();
          await logoutAction();
        });
      }}
    >
      Sign out
    </Button>
  );
}
