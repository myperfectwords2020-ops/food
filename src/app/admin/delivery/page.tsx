import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DeliveryRatesPanel } from "@/components/admin/delivery-rates-panel";

export default function AdminDeliveryRatesPage() {
  return (
    <>
      <AdminPageHeader
        title="Delivery by state"
        description="Set delivery fees for each Nigerian state. Checkout uses the fee for the customer’s shipping state."
      />
      <DeliveryRatesPanel />
    </>
  );
}
