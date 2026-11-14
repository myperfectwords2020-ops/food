"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useId, useRef, useState } from "react";

import { uploadAdminProductImageAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import type { AdminProductImage } from "@/types/admin";

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_IMAGES = 8;

type Props = {
  value: AdminProductImage[];
  onChange: (images: AdminProductImage[]) => void;
  productName: string;
  error?: string | undefined;
};

export function AdminProductImagesField({ value, onChange, productName, error }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;
      if (value.length + list.length > MAX_IMAGES) {
        setLocalError(`You can add up to ${MAX_IMAGES} images per product.`);
        return;
      }

      setLocalError(null);
      setUploading(true);
      const next = [...value];

      try {
        for (const file of list) {
          const formData = new FormData();
          formData.set("file", file);
          const result = await uploadAdminProductImageAction(formData);
          if (!result.ok) {
            setLocalError(result.error);
            break;
          }
          next.push({ url: result.url, storageKey: result.storageKey });
        }
        onChange(next);
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [onChange, value],
  );

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const displayError = error ?? localError;

  return (
    <div className="field full">
      <span id={`${inputId}-label`}>Product images</span>
      <p className="text-xs text-muted-foreground mb-2">
        Upload JPEG, PNG, or WebP (max 5 MB each). The first image is the storefront primary.
      </p>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        aria-labelledby={`${inputId}-label`}
        disabled={uploading || value.length >= MAX_IMAGES}
        onChange={(event) => {
          const files = event.target.files;
          if (files) void uploadFiles(files);
        }}
      />

      <div className="flex flex-wrap gap-3 items-start">
        {value.map((image, index) => (
          <figure
            key={`${image.url}-${index}`}
            className="relative w-28 h-36 rounded-md border border-border overflow-hidden bg-muted"
          >
            <Image
              src={image.url}
              alt={
                index === 0
                  ? `${productName || "Product"} primary image`
                  : `${productName || "Product"} image ${index + 1}`
              }
              fill
              className="object-cover"
              sizes="112px"
              unoptimized={image.url.startsWith("blob:")}
            />
            {index === 0 ? (
              <span className="absolute left-1 top-1 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium">
                Primary
              </span>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7"
              aria-label={`Remove image ${index + 1}`}
              onClick={() => removeAt(index)}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </figure>
        ))}

        {value.length < MAX_IMAGES ? (
          <button
            type="button"
            className="flex h-36 w-28 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/40 text-xs text-muted-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={uploading}
            aria-labelledby={`${inputId}-label`}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <ImagePlus className="h-5 w-5" aria-hidden />
            )}
            {uploading ? "Uploading…" : "Add images"}
          </button>
        ) : null}
      </div>

      {displayError ? (
        <span className="text-xs text-danger mt-2 block" role="alert">
          {displayError}
        </span>
      ) : null}
    </div>
  );
}
