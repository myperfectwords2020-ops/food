"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ConfirmActionButton({
  label,
  confirmMessage,
  onConfirm,
  variant = "outline",
}: {
  label: string;
  confirmMessage: string;
  onConfirm: () => void | Promise<void>;
  variant?: "default" | "outline" | "destructive";
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <Button type="button" variant={variant} size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
    );
  }

  return (
    <div
      className="panel inline-flex flex-col gap-2 max-w-xs"
      role="alertdialog"
      aria-labelledby="confirm-title"
    >
      <p id="confirm-title" className="text-xs leading-6">
        {confirmMessage}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={variant === "destructive" ? "destructive" : "default"}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
            } finally {
              setBusy(false);
              setOpen(false);
            }
          }}
        >
          Confirm
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
