import type { ReactNode } from "react";

import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Search", "Search the Greencart product collection.");

export default function SearchLayout({ children }: { children: ReactNode }) {
  return children;
}
