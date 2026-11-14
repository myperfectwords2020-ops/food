"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="empty-state">
      <h3>Something went wrong</h3>
      <p className="text-muted-foreground text-sm max-w-md mx-auto">{error.message}</p>
      <Button type="button" className="mt-4" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
