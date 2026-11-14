"use client";

import { useState } from "react";
import { toast } from "sonner";

import { useAdjustInventoryMutation } from "@/hooks/queries/admin/use-admin-inventory";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { Button } from "@/components/ui/button";

export function InventoryAdjustForm({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const adjustMutation = useAdjustInventoryMutation();
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const needsConfirm = Number(delta) <= -5;

  const applyAdjustment = async () => {
    setError(null);
    setSuccess(null);
    const result = await adjustMutation.mutateAsync({
      productId,
      delta: Number(delta),
      note: note || "Manual adjustment",
    });
    if (!result.ok) {
      setError(result.error ?? "Adjustment failed.");
      toast.error(result.error ?? "Adjustment failed.");
      return;
    }
    toast.success(`Stock updated for ${productName}`);
    setSuccess(`Stock updated for ${productName}.`);
    setDelta("");
    setNote("");
  };

  return (
    <form
      className="panel space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!needsConfirm) await applyAdjustment();
      }}
    >
      <h2 className="text-sm font-bold">Adjust stock · {productName}</h2>
      <label className="field" htmlFor={`delta-${productId}`}>
        <span>Quantity change (+ restock, − remove)</span>
        <input
          id={`delta-${productId}`}
          type="number"
          required
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
        />
      </label>
      <label className="field" htmlFor={`note-${productId}`}>
        <span>Note</span>
        <input id={`note-${productId}`} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      {needsConfirm ? (
        <ConfirmActionButton
          label="Confirm large reduction"
          variant="destructive"
          confirmMessage={`Reduce stock by ${Math.abs(Number(delta))} units for ${productName}?`}
          onConfirm={applyAdjustment}
        />
      ) : (
        <Button type="submit" size="sm">
          Apply adjustment
        </Button>
      )}
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-xs text-muted-foreground" role="status">
          {success}
        </p>
      ) : null}
    </form>
  );
}
