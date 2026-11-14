import type { ReactNode } from "react";
import type { Metadata } from "next";

type Props = {
  children: ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  const n = slug.replaceAll("-", " ");
  const fullTitle = `Shop ${n} — Greencart`;
  const description = `Explore skincare selected for ${n}.`;

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

export default function CategoryLayout({ children }: { children: ReactNode }) {
  return children;
}
