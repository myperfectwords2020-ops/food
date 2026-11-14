import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminProductsPanel } from "@/components/admin/lists/admin-products-panel";

export default function AdminProductsPage() {
  return (
    <>
      <AdminPageHeader
        title="Products"
        description="Catalog management for your tenant."
        actions={
          <Link href="/admin/products/new" className="btn btn-primary btn-md">
            New product
          </Link>
        }
      />
      <AdminProductsPanel />
    </>
  );
}
