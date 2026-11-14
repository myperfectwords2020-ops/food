import type { ReactNode } from "react";

type Props = {
  title: string;
  lede: string;
  children: ReactNode;
};

export function AuthPageShell({ title, lede, children }: Props) {
  return (
    <section className="gc-auth-page" aria-labelledby="auth-heading">
      <div className="gc-auth-card">
        <aside className="gc-auth-promo" aria-label="Why create an account">
          <p className="gc-auth-eyebrow">Greencart</p>
          <h2 className="gc-auth-promo-title">Fresh groceries, delivered fast.</h2>
          <ul className="gc-auth-benefits">
            <li>Track orders and delivery status</li>
            <li>Save addresses for quicker checkout</li>
            <li>Get meal ideas from our shopping assistant</li>
          </ul>
        </aside>
        <div className="gc-auth-main">
          <header className="gc-auth-header">
            <h1 id="auth-heading">{title}</h1>
            <p>{lede}</p>
          </header>
          {children}
        </div>
      </div>
    </section>
  );
}
