"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/types/commerce";

const STATUS_OPTIONS: OrderStatus[] = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
];

export function OrderAdminActions({
  orderId,
  customerEmail,
  paymentReference,
  initialStatus,
}: {
  orderId: string;
  customerEmail: string;
  paymentReference?: string | undefined;
  initialStatus: OrderStatus;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [saved, setSaved] = useState(false);

  return (
    <div className="panel flex flex-wrap gap-3 items-end">
      <label className="field min-w-[180px]">
        <span>Update status (UI only)</span>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as OrderStatus);
            setSaved(false);
          }}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <Button type="button" size="sm" onClick={() => setSaved(true)}>
        Preview change
      </Button>
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
      {saved ? (
        <p className="text-xs text-muted-foreground w-full m-0" role="status">
          Status preview for {orderId} — connect Orders API to persist changes server-side.
        </p>
      ) : null}
    </div>
  );
}
