"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { archiveAdminProductAction, saveAdminProductAction } from "@/app/actions/admin";
import { AdminProductImagesField } from "@/components/admin/admin-product-images-field";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { Button } from "@/components/ui/button";
import type { AdminProduct, AdminProductImage } from "@/types/admin";

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  price: z.coerce.number().min(0),
  images: z.array(z.object({ url: z.string().url(), storageKey: z.string().optional() })).min(1, {
    message: "Add at least one product image.",
  }),
  concern: z.string().min(1),
  skinTypes: z.string().min(1),
  ingredients: z.string().min(1),
  stock: z.coerce.number().min(0),
  status: z.enum(["active", "draft", "archived"]),
  usageInstructions: z.string().min(1),
  warnings: z.string().min(1),
  recommendationNote: z.string().optional(),
  relatedProductIds: z.string().optional(),
});

type Values = z.infer<typeof schema>;

function toValues(product?: AdminProduct | null): Values {
  const images: AdminProductImage[] = product?.images?.length
    ? product.images
    : product?.image
      ? [{ url: product.image }]
      : [];

  if (!product) {
    return {
      name: "",
      slug: "",
      category: "Serum",
      description: "",
      price: 0,
      images: [],
      concern: "",
      skinTypes: "All skin types",
      ingredients: "",
      stock: 0,
      status: "draft",
      usageInstructions: "",
      warnings: "",
      recommendationNote: "",
      relatedProductIds: "",
    };
  }
  return {
    name: product.name,
    slug: product.slug,
    category: product.category,
    description: product.description,
    price: product.price,
    images,
    concern: product.concern,
    skinTypes: product.skinTypes.join(", "),
    ingredients: product.ingredients.join(", "),
    stock: product.stock,
    status: product.status,
    usageInstructions: product.usageInstructions,
    warnings: product.warnings,
    recommendationNote: product.recommendationNote ?? "",
    relatedProductIds: product.relatedProductIds.join(", "),
  };
}

export function AdminProductForm({
  product,
  mode,
}: {
  product?: AdminProduct | null | undefined;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toValues(product),
  });
  const [message, setMessage] = useState<string | null>(null);
  const { isSubmitting, isDirty, errors } = form.formState;
  const productName = form.watch("name");

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  return (
    <form
      className="max-w-3xl space-y-6"
      noValidate
      onSubmit={form.handleSubmit(async (values) => {
        setMessage(null);
        const result = await saveAdminProductAction({
          id: product?.id,
          ...values,
          skinTypes: values.skinTypes
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          ingredients: values.ingredients
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          relatedProductIds: values.relatedProductIds
            ? values.relatedProductIds
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
        });
        if (!result.ok) {
          setMessage(result.error);
          toast.error(result.error);
          return;
        }
        toast.success(mode === "create" ? "Product created." : "Product saved.");
        setMessage(null);
        form.reset(values);
        if (mode === "create") router.push(`/admin/products/${result.productId}/edit`);
        router.refresh();
      })}
    >
      {isDirty ? (
        <p className="text-xs text-muted-foreground" role="status">
          Unsaved changes
        </p>
      ) : null}
      <div className="form-grid">
        {(
          [
            ["name", "Product name"],
            ["slug", "URL slug"],
            ["category", "Category"],
            ["price", "Price (NGN)"],
            ["stock", "Stock"],
            ["concern", "Primary concern"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="field" htmlFor={key}>
            <span>{label}</span>
            <input
              id={key}
              type={key === "price" || key === "stock" ? "number" : "text"}
              aria-invalid={Boolean(errors[key])}
              {...form.register(key)}
            />
            {errors[key] ? (
              <span className="text-xs text-danger" role="alert">
                {errors[key]?.message as string}
              </span>
            ) : null}
          </label>
        ))}

        <Controller
          control={form.control}
          name="images"
          render={({ field }) => (
            <AdminProductImagesField
              value={field.value}
              onChange={field.onChange}
              productName={productName}
              error={errors.images?.message}
            />
          )}
        />

        <label className="field" htmlFor="status">
          <span>Status</span>
          <select id="status" {...form.register("status")}>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="field full" htmlFor="description">
          <span>Description</span>
          <textarea id="description" rows={3} {...form.register("description")} />
        </label>
        <label className="field full" htmlFor="skinTypes">
          <span>Skin types (comma-separated)</span>
          <input id="skinTypes" {...form.register("skinTypes")} />
        </label>
        <label className="field full" htmlFor="ingredients">
          <span>Ingredients</span>
          <textarea id="ingredients" rows={2} {...form.register("ingredients")} />
        </label>
        <label className="field full" htmlFor="usageInstructions">
          <span>Usage</span>
          <textarea id="usageInstructions" rows={2} {...form.register("usageInstructions")} />
        </label>
        <label className="field full" htmlFor="warnings">
          <span>Warnings</span>
          <textarea id="warnings" rows={2} {...form.register("warnings")} />
        </label>
        <label className="field full" htmlFor="recommendationNote">
          <span>Recommendation metadata</span>
          <textarea id="recommendationNote" rows={2} {...form.register("recommendationNote")} />
        </label>
        <label className="field full" htmlFor="relatedProductIds">
          <span>Related product IDs</span>
          <input id="relatedProductIds" {...form.register("relatedProductIds")} />
        </label>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
        </Button>
        {product?.id ? (
          <ConfirmActionButton
            label="Archive"
            variant="destructive"
            confirmMessage="Archive this product? It will be hidden from the storefront."
            onConfirm={async () => {
              await archiveAdminProductAction(product.id);
              router.push("/admin/products");
              router.refresh();
            }}
          />
        ) : null}
      </div>
      {message ? (
        <p className="text-xs text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
