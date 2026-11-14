"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Mail, MapPin, Menu, Phone, Search, ShoppingCart, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { AssistantFabEntry } from "@/components/assistant/assistant-fab-entry";
import { SessionAccountLink } from "@/components/auth/session-account-link";
import { CartBadge } from "@/components/cart/cart-badge";
import { NewsletterSignup } from "@/components/storefront/newsletter-signup";

const nav = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Ask AI", to: "/assistant" },
  { label: "About Us", to: "/about" },
  { label: "Contact", to: "/contact" },
] as const;

const footerColumns = [
  {
    title: "Customer Service",
    links: [
      { label: "Contact Us", to: "/contact" },
      { label: "FAQ", to: "/faq" },
      { label: "Returns", to: "/faq" },
      { label: "Track Order", to: "/account/orders" },
    ],
  },
  {
    title: "About Us",
    links: [
      { label: "Our Story", to: "/about" },
      { label: "Ask Our Assistant", to: "/assistant" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "Quick Links",
    links: [
      { label: "All Products", to: "/shop" },
      { label: "New Arrivals", to: "/shop?sort=newest" },
      { label: "Cart", to: "/cart" },
    ],
  },
  {
    title: "My Account",
    links: [
      { label: "Account", to: "/account" },
      { label: "Orders", to: "/account/orders" },
      { label: "Addresses", to: "/account/addresses" },
      { label: "Sign In", to: "/account/login" },
    ],
  },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BrandMark({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className={inverted ? "gc-logo gc-logo-inverted" : "gc-logo"}>
      <span className="gc-logo-icon" aria-hidden>
        <ShoppingCart size={18} strokeWidth={2.4} />
      </span>
      Greencart
    </span>
  );
}

export function StorefrontShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (pathname.startsWith("/admin")) return children;

  return (
    <div className="storefront-root min-h-screen">
      <header className="gc-header">
        <div className="gc-wrap gc-header-top">
          <Link href="/" aria-label="Greencart home">
            <BrandMark />
          </Link>
          <form className="gc-search" action="/shop" role="search">
            <label htmlFor="header-search" className="sr-only">
              Search groceries
            </label>
            <input
              id="header-search"
              name="q"
              type="search"
              placeholder="Search for fruits, vegetables, dairy..."
            />
            <button type="submit" aria-label="Search">
              <Search size={16} aria-hidden />
            </button>
          </form>
          <div className="gc-header-actions">
            <span className="gc-icon-link gc-hide-xs">
              <SessionAccountLink />
            </span>
            <Link href="/cart" aria-label="Cart" className="gc-icon-link gc-cart">
              <ShoppingCart size={20} aria-hidden />
              <CartBadge />
            </Link>
            <button
              type="button"
              className="gc-icon-link gc-menu-toggle"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-navigation"
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
            </button>
          </div>
        </div>
        <div className="gc-header-nav">
          <div className="gc-wrap gc-header-nav-inner">
            <Link href="/shop" className="gc-categories-link">
              <LayoutGrid size={16} aria-hidden />
              All Categories
            </Link>
            <nav className="gc-nav" aria-label="Main navigation">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  href={item.to}
                  aria-current={isActive(pathname, item.to) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        {open ? (
          <nav id="mobile-navigation" className="gc-mobile-nav" aria-label="Mobile navigation">
            <form className="gc-search gc-search-mobile" action="/shop" role="search">
              <label htmlFor="mobile-search" className="sr-only">
                Search groceries
              </label>
              <input id="mobile-search" name="q" type="search" placeholder="Search groceries..." />
              <button type="submit" aria-label="Search">
                <Search size={16} aria-hidden />
              </button>
            </form>
            {nav.map((item) => (
              <Link
                key={item.to}
                href={item.to}
                aria-current={isActive(pathname, item.to) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/account">My account</Link>
          </nav>
        ) : null}
      </header>
      <main>{children}</main>
      <AssistantFabEntry />
      <footer className="gc-footer">
        <div className="gc-wrap gc-footer-main">
          <div className="gc-footer-brand">
            <BrandMark />
            <p>
              Fresh fruits, vegetables, dairy, and pantry essentials delivered to your door—fast,
              affordable, and always fresh.
            </p>
            <NewsletterSignup variant="footer" />
          </div>
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3>{column.title}</h3>
              <nav aria-label={`${column.title} links`}>
                {column.links.map((link) => (
                  <Link key={link.label} href={link.to}>
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
        <div className="gc-wrap gc-footer-contact">
          <span>
            <MapPin size={16} aria-hidden /> Lagos, Nigeria
          </span>
          <span>
            <Phone size={16} aria-hidden /> +234 800 000 0000
          </span>
          <span>
            <Mail size={16} aria-hidden /> hello@greencart.ng
          </span>
        </div>
        <div className="gc-wrap gc-footer-bottom">
          <span>© 2026 Greencart. All rights reserved.</span>
          <span>Secure payments by Paystack</span>
        </div>
      </footer>
    </div>
  );
}
