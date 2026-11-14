"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { updateAdminOrderStatusAction } from "@/app/actions/admin";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { Button } from "@/components/ui/button";
import { ORDER_STATUS_LABELS } from "@/modules/orders/order-status-map";
import type { OrderStatus } from "@/types/commerce";

export function OrderAdminActions({
  orderId,
  customerEmail,
  paymentReference,
  initialStatus,
  nextStatusOptions,
}: {
  orderId: string;
  customerEmail: string;
  paymentReference?: string | undefined;
  initialStatus: OrderStatus;
  nextStatusOptions: OrderStatus[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const target = status || null;
  const unchanged = !target;
  const isCancel = target === "cancelled";

  const statusLabel = useMemo(() => ORDER_STATUS_LABELS[initialStatus], [initialStatus]);

  async function persist(next: OrderStatus) {
    setPending(true);
    setError(null);
    const result = await updateAdminOrderStatusAction(orderId, next);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStatus("");
    router.refresh();
  }

  return (
    <div className="panel flex flex-wrap gap-3 items-end" aria-busy={pending}>
      <div className="field min-w-[200px]">
        <span id="order-current-status-label">Fulfillment status</span>
        <p
          id="order-current-status"
          className="text-sm font-medium m-0 py-2"
          aria-labelledby="order-current-status-label"
        >
          {statusLabel}
        </p>
      </div>
      {nextStatusOptions.length > 0 ? (
        <label className="field min-w-[200px]" htmlFor="order-next-status">
          <span>Move to</span>
          <select
            id="order-next-status"
            value={status}
            disabled={pending}
            onChange={(e) => {
              setStatus(e.target.value as OrderStatus);
              setError(null);
            }}
          >
            <option value="">Select next status…</option>
            {nextStatusOptions.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="text-xs text-muted-foreground m-0">
          No further status changes for this order.
        </p>
      )}
      {initialStatus === "paid" && nextStatusOptions.length > 0 ? (
        <p className="text-xs text-muted-foreground w-full m-0">
          Payment is complete. Choose the delivery stage — you can jump to &quot;Out for
          delivery&quot; or &quot;Delivered&quot; without saving each step separately.
        </p>
      ) : null}
      {target && !isCancel ? (
        <Button
          type="button"
          size="sm"
          disabled={unchanged || pending}
          onClick={() => void persist(target)}
        >
          {pending ? "Saving…" : "Save status"}
        </Button>
      ) : null}
      {target && isCancel ? (
        <ConfirmActionButton
          label={pending ? "Saving…" : "Cancel order"}
          confirmMessage="Cancel this order? This cannot be undone from the storefront."
          variant="destructive"
          onConfirm={async () => {
            await persist("cancelled");
          }}
        />
      ) : null}
      <Link
        href={`/admin/orders?q=${encodeURIComponent(customerEmail)}`}
        className="btn btn-outline btn-sm"
      >
        View customer orders
      </Link>
      {paymentReference ? (
        <a href="#payment-panel" className="btn btn-outline btn-sm">
          View payment
        </a>
      ) : null}
      <a href="#order-timeline" className="btn btn-outline btn-sm">
        View timeline
      </a>
      {error ? (
        <p className="text-xs text-destructive w-full m-0" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
