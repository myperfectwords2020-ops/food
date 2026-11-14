import type { ReactNode } from "react";

import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Your bag", "Review your Greencart groceries before checkout.");

export default function CartLayout({ children }: { children: ReactNode }) {
  return children;
}
