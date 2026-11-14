"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";

export function NewsletterSignup({ variant = "default" }: { variant?: "default" | "footer" }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const footer = variant === "footer";

  return (
    <form
      className={footer ? "gc-subscribe" : "newsletter max-w-md"}
      onSubmit={(e) => {
        e.preventDefault();
        setMessage("Thank you—we'll be in touch soon.");
        setEmail("");
      }}
    >
      <label className="sr-only" htmlFor={id}>
        Email address
      </label>
      <input
        id={id}
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={footer ? "Enter Your Email..." : "Your email address"}
      />
      {footer ? (
        <button type="submit">Subscribe</button>
      ) : (
        <Button type="submit" variant="secondary">
          Join
        </Button>
      )}
      {message ? (
        <p className="sr-only" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
