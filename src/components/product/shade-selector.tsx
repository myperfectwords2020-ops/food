"use client";

import { useId, useState } from "react";

import type { ProductShade } from "@/config/product-shades";
import { cn } from "@/lib/utils";

type Props = {
  shades: ProductShade[];
  productName: string;
};

export function ShadeSelector({ shades, productName }: Props) {
  const groupId = useId();
  const [selected, setSelected] = useState(0);
  const active = shades[selected];

  if (!active) return null;

  return (
    <fieldset className="mt-6 border-0 p-0 m-0">
      <legend className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Shade
      </legend>
      <p className="mt-1 text-sm font-semibold" id={`${groupId}-label`}>
        {active.name}
      </p>
      <div
        className="mt-3 flex flex-wrap gap-2"
        role="radiogroup"
        aria-labelledby={`${groupId}-label`}
        aria-label={`Shade options for ${productName}`}
      >
        {shades.map((shade, index) => {
          const checked = index === selected;
          return (
            <button
              key={shade.name}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={shade.name}
              title={shade.name}
              className={cn(
                "h-9 w-9 rounded-full border-2 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                checked ? "border-foreground shadow-sm" : "border-transparent",
              )}
              style={{ backgroundColor: shade.hex }}
              onClick={() => setSelected(index)}
            />
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Shade preview for demo—your bag uses the product listing; full variant SKUs can be enabled
        later.
      </p>
    </fieldset>
  );
}
