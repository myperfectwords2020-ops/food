"use client";

import { useEffect, useState } from "react";

import { useSaveDeliveryRatesMutation } from "@/hooks/queries/admin/use-admin-delivery-rates";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/format";
import { fromMinorUnits } from "@/lib/money";
import type { DeliveryRateRow } from "@/modules/commerce/delivery-rate.service";

function minorFromNairaInput(value: string): number {
  const n = Number.parseFloat(value.replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0) return NaN;
  return Math.round(n * 100);
}

function nairaInputFromMinor(minor: number): string {
  return (minor / 100).toFixed(2);
}

export function DeliveryRatesForm({ initialRates }: { initialRates: DeliveryRateRow[] }) {
  const saveMutation = useSaveDeliveryRatesMutation();
  const [rows, setRows] = useState(initialRates);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setRows(initialRates);
  }, [initialRates]);

  return (
    <form
      className="panel overflow-x-auto"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        void (async () => {
          const updates = rows.map((r) => {
            const deliveryMinor = minorFromNairaInput(
              (document.getElementById(`rate-${r.stateCode}`) as HTMLInputElement).value,
            );
            const enabled = (document.getElementById(`enabled-${r.stateCode}`) as HTMLInputElement)
              .checked;
            return { stateCode: r.stateCode, deliveryMinor, enabled };
          });
          if (updates.some((u) => !Number.isInteger(u.deliveryMinor))) {
            setMessage("Enter a valid delivery amount for every state.");
            return;
          }
          const result = await saveMutation.mutateAsync(updates);
          if (!result.ok) setMessage(result.error);
          else setMessage("Delivery rates saved.");
        })();
      }}
    >
      <table className="data-table">
        <thead>
          <tr>
            <th>State</th>
            <th>Delivery fee (₦)</th>
            <th>Enabled</th>
            <th>Preview</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.stateCode}>
              <td>
                <span className="font-medium">{row.stateName}</span>
                <span className="text-xs text-muted-foreground ml-2">{row.stateCode}</span>
              </td>
              <td>
                <label className="sr-only" htmlFor={`rate-${row.stateCode}`}>
                  Delivery fee for {row.stateName}
                </label>
                <input
                  id={`rate-${row.stateCode}`}
                  type="number"
                  min={0}
                  step={0.01}
                  defaultValue={nairaInputFromMinor(row.deliveryMinor)}
                  className="w-28"
                  onChange={(e) => {
                    const minor = minorFromNairaInput(e.target.value);
                    if (Number.isInteger(minor)) {
                      setRows((prev) =>
                        prev.map((r) =>
                          r.stateCode === row.stateCode ? { ...r, deliveryMinor: minor } : r,
                        ),
                      );
                    }
                  }}
                />
              </td>
              <td>
                <input
                  id={`enabled-${row.stateCode}`}
                  type="checkbox"
                  defaultChecked={row.enabled}
                  aria-label={`Delivery enabled for ${row.stateName}`}
                />
              </td>
              <td className="text-sm text-muted-foreground">
                {formatNaira(fromMinorUnits(row.deliveryMinor))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-3 items-center mt-4">
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving…" : "Save delivery rates"}
        </Button>
        {message ? (
          <p className="text-sm text-muted-foreground m-0" role="status">
            {message}
          </p>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground mt-3 leading-6">
        Checkout uses the fee for the customer&apos;s selected state. Amounts are stored in kobo on
        the server; Paystack charges the order total including this fee.
      </p>
    </form>
  );
}
