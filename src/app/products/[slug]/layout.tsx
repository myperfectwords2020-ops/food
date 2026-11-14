import type { Metadata } from "next";
import type { ReactNode } from "react";

import { catalogService } from "@/services/index";

type Props = {
  children: ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  const p = await catalogService.getProductBySlug(slug);
  const title = p?.name ?? "Grocery product";
  const description = p?.description ?? "Fresh from the Greencart shelves.";
  const fullTitle = `${title} — Greencart`;

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

export async function generateStaticParams() {
  const { listActiveProductSlugs } = await import("@/modules/catalog/public-catalog.service");
  try {
    return await listActiveProductSlugs();
  } catch {
    return [];
  }
}

export default function ProductLayout({ children }: { children: ReactNode }) {
  return children;
}
