"use client";

import type { ReactNode } from "react";

export function AdminQueryState({
  isLoading,
  isError,
  errorMessage,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string | undefined;
  children: ReactNode;
}) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-8">Loading…</p>;
  }
  if (isError) {
    return (
      <p className="text-sm text-danger py-8" role="alert">
        {errorMessage ?? "Could not load data."}
      </p>
    );
  }
  return children;
}
