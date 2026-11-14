import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ q?: string | string[] }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim();
  redirect(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
}
