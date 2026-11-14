import { HomePageContent } from "@/components/home/home-page-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Fresh groceries delivered fast",
  "Shop fresh fruits, vegetables, meat, fish, dairy, and essentials with same-day delivery.",
);

export default function HomePage() {
  return <HomePageContent />;
}
