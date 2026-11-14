"use client";

import { DeliveryRatesForm } from "@/components/admin/delivery-rates-form";
import { AdminQueryState } from "@/components/admin/lists/admin-query-state";
import { useAdminDeliveryRatesQuery } from "@/hooks/queries/admin/use-admin-delivery-rates";

export function DeliveryRatesPanel() {
  const { data, isLoading, isError, error } = useAdminDeliveryRatesQuery();

  return (
    <AdminQueryState
      isLoading={isLoading}
      isError={isError}
      errorMessage={error instanceof Error ? error.message : undefined}
    >
      {data ? <DeliveryRatesForm initialRates={data} /> : null}
    </AdminQueryState>
  );
}
