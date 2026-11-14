"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { useSession } from "next-auth/react";

/** Mobile header account icon — account when signed in, login when not. */
export function SessionAccountLink() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <span className="inline-flex p-2 opacity-50" aria-hidden>
        <UserRound size={19} />
      </span>
    );
  }

  const href =
    session?.user?.role === "CUSTOMER"
      ? "/account"
      : session?.user
        ? "/admin/dashboard"
        : "/account/login";

  const label = session?.user ? "Account" : "Sign in";

  return (
    <Link href={href} aria-label={label}>
      <UserRound size={19} />
    </Link>
  );
}
