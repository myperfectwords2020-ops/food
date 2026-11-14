import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <div className="page-shell">
      <div className="panel max-w-lg">
        <h1 className="text-xl font-bold">Access denied</h1>
        <p className="mt-3 text-muted-foreground text-sm leading-7">
          You do not have permission to view that area.
        </p>
        <Link href="/" className="gc-btn gc-btn-green mt-6">
          Return to storefront
        </Link>
      </div>
    </div>
  );
}
