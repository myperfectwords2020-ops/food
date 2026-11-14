"use client";

import { useState } from "react";

import { initializePaymentAction } from "@/app/actions/payments";
export function OrderPaymentRetry({
  orderId,
  label = "Retry payment",
  size = "default",
}: {
  orderId: string;
  label?: string;
  size?: "default" | "sm";
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="gc-order-pay-retry">
      <button
        type="button"
        className={`gc-btn gc-btn-green ${size === "sm" ? "gc-btn-sm" : ""}`}
        disabled={loading}
        onClick={async () => {
          setError(null);
          setLoading(true);
          try {
            const result = await initializePaymentAction(orderId);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            window.location.assign(result.authorizationUrl);
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? "Starting payment…" : label}
      </button>
      {error ? (
        <p className="gc-checkout-alert" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
