"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { SignOutButton } from "@/components/account/sign-out-button";
import { adminNav } from "@/components/admin/admin-nav-config";
import { BrandMark } from "@/components/storefront";
import { Button } from "@/components/ui/button";

function navActive(pathname: string, href: string) {
  if (href === "/admin/dashboard") return pathname === href ? "active" : undefined;
  return pathname === href || pathname.startsWith(`${href}/`) ? "active" : undefined;
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <Link href="/admin/dashboard">
          <BrandMark inverted />
        </Link>
        <nav className="admin-nav">
          {adminNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={navActive(pathname, item.href)}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={16} aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="admin-user">
          <i aria-hidden>M</i>
          <div className="min-w-0 flex-1">
            <strong>Signed in</strong>
            <span className="block truncate">Admin session</span>
            <SignOutButton variant="inline" />
          </div>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <Button
              type="button"
              variant="icon"
              className="mobile-menu"
              aria-label={mobileOpen ? "Close admin menu" : "Open admin menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X /> : <Menu />}
            </Button>
            <label className="search-box sr-only" htmlFor="admin-global-search">
              Search admin
            </label>
            <div className="search-box flex items-center gap-2 text-muted-foreground text-sm">
              <Search size={16} aria-hidden />
              <span>Operations console</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs font-bold">
              View storefront
            </Link>
            <SignOutButton variant="header" />
          </div>
        </header>
        {mobileOpen ? (
          <nav className="mobile-nav md:hidden" aria-label="Admin mobile navigation">
            {adminNav.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
