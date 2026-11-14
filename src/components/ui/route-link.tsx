import Link from "next/link";
import type { ComponentProps } from "react";

import { buttonVariants, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RouteLinkProps = ComponentProps<typeof Link> &
  Pick<ButtonProps, "variant" | "size"> & {
    className?: string;
  };

export function RouteLink({
  className,
  variant = "primary",
  size = "md",
  ...props
}: RouteLinkProps) {
  return (
    <Link
      className={cn(
        buttonVariants({
          variant: variant ?? "primary",
          size: size ?? "md",
        }),
        className,
      )}
      {...props}
    />
  );
}
