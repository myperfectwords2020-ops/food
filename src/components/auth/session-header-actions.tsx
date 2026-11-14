"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

import { SignOutButton } from "@/components/account/sign-out-button";

export function SessionHeaderActions() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return null;
  }

  if (status === "unauthenticated" || !session?.user) {
    return (
      <Link href="/account/login" className="text-sm font-bold whitespace-nowrap">
        Sign in
      </Link>
    );
  }

  const accountHref = session.user.role === "CUSTOMER" ? "/account" : "/admin/dashboard";

  return (
    <div className="flex items-center gap-3">
      <Link href={accountHref} className="text-sm font-bold whitespace-nowrap">
        Account
      </Link>
      <SignOutButton variant="header" />
    </div>
  );
}
