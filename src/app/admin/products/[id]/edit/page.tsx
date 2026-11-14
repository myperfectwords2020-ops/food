import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminProductForm } from "@/components/admin/admin-product-form";
import { adminService } from "@/services/index";

type Props = { params: Promise<{ id: string }> };

export default async function AdminProductEditPage({ params }: Props) {
  const { id } = await params;
  const product = await adminService.getProduct(id);
  if (!product) notFound();

  return (
    <>
      <AdminPageHeader title="Edit product" description={product.name} />
      <AdminProductForm mode="edit" product={product} />
    </>
  );
}
