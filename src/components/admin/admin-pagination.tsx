"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function AdminPagination({
  page,
  totalPages,
  paramName = "page",
}: {
  page: number;
  totalPages: number;
  paramName?: string;
}) {
  const params = useSearchParams();
  if (totalPages <= 1) return null;

  const hrefFor = (p: number) => {
    const next = new URLSearchParams(params.toString());
    next.set(paramName, String(p));
    return `?${next.toString()}`;
  };

  return (
    <nav className="flex gap-2 mt-4 items-center text-sm" aria-label="Pagination">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className="btn btn-outline btn-sm">
          Previous
        </Link>
      ) : null}
      <span className="text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className="btn btn-outline btn-sm">
          Next
        </Link>
      ) : null}
    </nav>
  );
}
