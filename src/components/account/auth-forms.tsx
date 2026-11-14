"use client";

import Link from "next/link";
import { useActionState } from "react";

import { loginAction, registerAction } from "@/app/actions/auth";

type AuthFormState = {
  error?: string | undefined;
};

const initialState: AuthFormState = {};

const inputClass = "gc-auth-input";

export function LoginForm({ callbackUrl }: { callbackUrl?: string | undefined }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: AuthFormState, formData: FormData) => {
      if (callbackUrl) formData.set("callbackUrl", callbackUrl);
      const result = await loginAction(formData);
      if (result?.error) {
        return { error: result.error };
      }
      return initialState;
    },
    initialState,
  );

  return (
    <form action={formAction} className="gc-auth-form" noValidate>
      {state.error ? (
        <p className="gc-auth-alert" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="gc-auth-field">
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          className={inputClass}
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </div>
      <div className="gc-auth-field">
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          className={inputClass}
          type="password"
          name="password"
          autoComplete="current-password"
          minLength={8}
          placeholder="Your password"
          required
        />
      </div>
      <button type="submit" className="gc-btn gc-btn-green gc-auth-submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="gc-auth-footer">
        New here?{" "}
        <Link href="/account/register" className="gc-auth-link">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: AuthFormState, formData: FormData) => {
      const result = await registerAction(formData);
      if (result?.error) {
        return { error: result.error };
      }
      return initialState;
    },
    initialState,
  );

  return (
    <form action={formAction} className="gc-auth-form" noValidate>
      {state.error ? (
        <p className="gc-auth-alert" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="gc-auth-field-row">
        <div className="gc-auth-field">
          <label htmlFor="register-first-name">First name</label>
          <input
            id="register-first-name"
            className={inputClass}
            name="firstName"
            autoComplete="given-name"
            placeholder="Ada"
            required
          />
        </div>
        <div className="gc-auth-field">
          <label htmlFor="register-last-name">Last name</label>
          <input
            id="register-last-name"
            className={inputClass}
            name="lastName"
            autoComplete="family-name"
            placeholder="Okonkwo"
            required
          />
        </div>
      </div>
      <div className="gc-auth-field">
        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          className={inputClass}
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </div>
      <div className="gc-auth-field">
        <label htmlFor="register-phone">Phone (optional)</label>
        <input
          id="register-phone"
          className={inputClass}
          type="tel"
          name="phone"
          autoComplete="tel"
          placeholder="+234 800 000 0000"
        />
      </div>
      <div className="gc-auth-field">
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          className={inputClass}
          type="password"
          name="password"
          autoComplete="new-password"
          minLength={8}
          placeholder="Create a password"
          required
          aria-describedby="register-password-hint"
        />
        <p id="register-password-hint" className="gc-auth-hint">
          At least 8 characters.
        </p>
      </div>
      <button type="submit" className="gc-btn gc-btn-green gc-auth-submit" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </button>
      <p className="gc-auth-footer">
        Already have an account?{" "}
        <Link href="/account/login" className="gc-auth-link">
          Sign in
        </Link>
      </p>
    </form>
  );
}
