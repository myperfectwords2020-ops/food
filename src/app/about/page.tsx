import { PageIntro } from "@/components/page-ui";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "About Greencart",
  "Fresh groceries from local farms, delivered fast across Lagos.",
);

export default function AboutPage() {
  return (
    <div className="page-shell max-w-3xl">
      <PageIntro
        eyebrow="Our story"
        title="Fresh food, delivered with care."
        copy="Greencart began with a simple belief: good food should be fresh, fairly priced, and easy to get—without a trip to the market."
      />
      <div className="panel space-y-4 text-sm leading-7 text-muted-foreground">
        <p>
          We work directly with local farms and trusted suppliers to stock fruits, vegetables, meat,
          fish, dairy, bakery, and pantry essentials—picked and packed the day you order.
        </p>
        <p>
          Our team combines careful sourcing with simple digital tools so you can shop, get
          suggestions from our assistant, and track every delivery with confidence.
        </p>
        <p>
          Always check product labels for allergens. If you have specific dietary or medical needs,
          please consult a qualified professional.
        </p>
      </div>
    </div>
  );
}
