"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import {
  useConvertLeadMutation,
  useQualifyLeadMutation,
} from "@/hooks/queries/admin/use-admin-lead-mutations";
import type { LeadStatus } from "@/types/admin";

type Props = {
  leadId: string;
  status: LeadStatus;
  convertedCustomerId?: string | undefined;
};

export function LeadDetailActions({ leadId, status, convertedCustomerId }: Props) {
  const router = useRouter();
  const convert = useConvertLeadMutation();
  const qualify = useQualifyLeadMutation();

  if (convertedCustomerId) {
    return (
      <Link href={`/admin/customers/${convertedCustomerId}`} className="btn btn-primary btn-sm">
        View customer
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "QUALIFIED" && status !== "CONVERTED" ? (
        <ConfirmActionButton
          label="Qualify"
          confirmMessage="Mark this lead as qualified using CRM rules?"
          onConfirm={async () => {
            await qualify.mutateAsync(leadId);
            router.refresh();
          }}
        />
      ) : null}
      <ConfirmActionButton
        label="Mark converted"
        confirmMessage="Convert this lead to a customer record? This is idempotent."
        onConfirm={async () => {
          const result = await convert.mutateAsync(leadId);
          if (result.customerId) {
            router.push(`/admin/customers/${result.customerId}`);
          } else {
            router.refresh();
          }
        }}
      />
    </div>
  );
}
