import { PageIntro } from "@/components/page-ui";
import { ShopPageShell } from "@/components/shop/shop-page-shell";
import { parseShopSearchParams } from "@/lib/shop-search-params";
import { catalogService } from "@/services/index";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ShopPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filters = parseShopSearchParams(sp);
  const [result, categories, skinTypes, concerns] = await Promise.all([
    catalogService.listProducts(filters),
    catalogService.listCategories(),
    catalogService.listSkinTypes(),
    catalogService.listConcerns(),
  ]);

  return (
    <div className="page-shell">
      <PageIntro
        eyebrow="Shop"
        title="Fresh groceries, every day."
        copy="Filter by aisle, dietary preference, or what you're cooking—fruits, vegetables, meat, dairy, and more."
      />
      <ShopPageShell
        filterOptions={{ categories, skinTypes, concerns }}
        filters={filters}
        result={result}
      />
    </div>
  );
}
