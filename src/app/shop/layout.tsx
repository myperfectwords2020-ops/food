import type { ReactNode } from "react";

import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Shop groceries",
  "Fresh fruits, vegetables, meat, fish, dairy, bakery, and pantry essentials delivered to your door.",
);

export default function ShopLayout({ children }: { children: ReactNode }) {
  return children;
}
