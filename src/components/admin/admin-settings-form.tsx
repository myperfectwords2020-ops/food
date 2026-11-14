"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { AdminSettings } from "@/types/admin";

const tabs = [
  "Business",
  "Branding",
  "Notifications",
  "Payments",
  "Integrations",
  "AI",
  "Automation",
  "Team",
  "Permissions",
] as const;

export function AdminSettingsForm({ settings }: { settings: AdminSettings }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Business");
  const [saved, setSaved] = useState(false);

  return (
    <div>
      <div className="settings-tabs" role="tablist" aria-label="Settings sections">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? "active" : undefined}
            onClick={() => {
              setTab(t);
              setSaved(false);
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="settings-body">
        {tab === "Business" ? (
          <fieldset className="form-grid">
            <label className="field">
              <span>Business name</span>
              <input defaultValue={settings.business.name} readOnly />
            </label>
            <label className="field">
              <span>Email</span>
              <input defaultValue={settings.business.email} readOnly />
            </label>
            <label className="field">
              <span>Timezone</span>
              <input defaultValue={settings.business.timezone} readOnly />
            </label>
          </fieldset>
        ) : null}
        {tab === "Payments" ? (
          <p className="text-sm leading-7 text-muted-foreground">
            Paystack secret keys are stored server-side only. Public key status:{" "}
            {settings.payments.paystackConfigured ? "configured" : "not set"}.
          </p>
        ) : null}
        {tab === "AI" ? (
          <div className="space-y-3 text-sm">
            <p>Assistant enabled: {settings.ai.enabled ? "Yes" : "No"}</p>
            <p className="text-muted-foreground">{settings.ai.disclaimer}</p>
            <p className="text-xs text-muted-foreground">
              Model API keys and prompts are never exposed in the admin UI.
            </p>
          </div>
        ) : null}
        {tab === "Team" ? (
          <ul className="space-y-2">
            {settings.team.map((u) => (
              <li key={u.id} className="panel text-sm">
                <strong>{u.name}</strong> · {u.role} · {u.email}
              </li>
            ))}
          </ul>
        ) : null}
        {tab === "Permissions" ? (
          <ul className="space-y-2">
            {settings.permissions.map((p) => (
              <li key={p.role} className="panel text-sm">
                <strong>{p.role}</strong>: {p.capabilities.join(", ")}
              </li>
            ))}
          </ul>
        ) : null}
        {!["Business", "Payments", "AI", "Team", "Permissions"].includes(tab) ? (
          <p className="text-sm text-muted-foreground leading-7">
            {tab} settings use mock values. Connect the settings API to persist changes with server
            authorization.
          </p>
        ) : null}
        <Button type="button" className="mt-6" onClick={() => setSaved(true)}>
          Save settings
        </Button>
        {saved ? (
          <p className="text-xs text-muted-foreground mt-2" role="status">
            Prototype save — wire to Admin Settings API for production.
          </p>
        ) : null}
      </div>
    </div>
  );
}
