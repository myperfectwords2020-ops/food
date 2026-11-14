"use client";

import { useState } from "react";

import { initializePaymentAction } from "@/app/actions/payments";
import { Button } from "@/components/ui/button";

export function PayWithPaystackButton({
  orderId,
  disabled,
  onBeforeRedirect,
}: {
  orderId: string;
  disabled?: boolean;
  onBeforeRedirect?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pay = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await initializePaymentAction(orderId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onBeforeRedirect?.();
      window.location.assign(result.authorizationUrl);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        type="button"
        className="mt-4"
        disabled={disabled || loading}
        onClick={() => void pay()}
      >
        {loading ? "Starting payment…" : "Pay with Paystack"}
      </Button>
      {error ? (
        <p className="text-xs text-danger mt-2" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
