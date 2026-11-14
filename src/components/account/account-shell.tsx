"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { SignOutButton } from "@/components/account/sign-out-button";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/preferences", label: "Preferences" },
  { href: "/account/notifications", label: "Notifications" },
  { href: "/account/recommendations", label: "Recommendations" },
] as const;

export function AccountShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="page-shell account-layout">
      <nav className="account-nav" aria-label="Account navigation">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              pathname === link.href || pathname.startsWith(`${link.href}/`) ? "active" : undefined
            }
          >
            {link.label}
          </Link>
        ))}
        <div className="account-nav-signout mt-4 pt-4 border-t border-border">
          <SignOutButton variant="nav" />
        </div>
      </nav>
      <div>
        <header className="page-intro">
          <div>
            <p className="eyebrow">Your account</p>
            <h1>{title}</h1>
          </div>
          <SignOutButton />
        </header>
        {children}
      </div>
    </div>
  );
}
