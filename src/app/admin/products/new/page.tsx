import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminProductForm } from "@/components/admin/admin-product-form";

export default function AdminProductNewPage() {
  return (
    <>
      <AdminPageHeader
        title="New product"
        description="Add catalog details and upload product images to your S3 bucket."
      />
      <AdminProductForm mode="create" />
    </>
  );
}
