import type { ReactNode } from "react";

import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Find your routine",
  "A calm, guided skincare consultation based on your preferences and product information.",
);

export default function RoutineLayout({ children }: { children: ReactNode }) {
  return children;
}
