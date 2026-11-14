import type { PrismaClient, ProductStatus, RoutineStep } from "@prisma/client";

import { catalogImageForProduct } from "../src/config/catalog-images";

type SeedProduct = {
  slug: string;
  name: string;
  category: string;
  routineStep?: RoutineStep | null;
  description: string;
  priceMinor: number;
  stock: number;
  badge?: string;
  /** Stored as the product "concern" facet; shown to shoppers as "Good for". */
  concern: string;
  /** Stored as the product "skin type" facet; shown to shoppers as dietary tags. */
  skinTypes: string[];
  ingredients: string[];
  status?: ProductStatus;
  usageInstructions?: string;
  warnings?: string;
};

const CATEGORIES = [
  "Bread & Bakery",
  "Fruits",
  "Vegetables",
  "Meat & Fish",
  "Drinks",
  "Milk & Dairy",
  "Snacks & Sweets",
] as const;

const PRODUCTS: SeedProduct[] = [
  {
    slug: "fresh-atlantic-salmon",
    name: "Fresh Atlantic Salmon",
    category: "Meat & Fish",
    description: "Skin-on salmon fillet, cleaned and portioned. Rich in omega-3. Approx. 500g.",
    priceMinor: 1450000,
    stock: 24,
    badge: "Sale 15%",
    concern: "Protein",
    skinTypes: ["Gluten-free", "High protein"],
    ingredients: ["Atlantic salmon"],
    usageInstructions: "Keep refrigerated at 0–4°C. Cook thoroughly within 2 days of delivery.",
  },
  {
    slug: "grass-fed-beef-steak",
    name: "Grass-Fed Beef Steak",
    category: "Meat & Fish",
    description:
      "Tender sirloin cuts from grass-fed cattle, ideal for grilling or pan-searing. Approx. 500g.",
    priceMinor: 980000,
    stock: 30,
    concern: "Protein",
    skinTypes: ["Gluten-free", "High protein"],
    ingredients: ["Beef sirloin"],
    usageInstructions: "Keep refrigerated at 0–4°C. Cook thoroughly within 2 days of delivery.",
  },
  {
    slug: "red-bell-pepper",
    name: "Red Bell Pepper",
    category: "Vegetables",
    description:
      "Crisp, sweet red bell peppers—great for stews, salads, and stir-fries. Pack of 3.",
    priceMinor: 180000,
    stock: 120,
    badge: "Organic",
    concern: "Everyday cooking",
    skinTypes: ["Organic", "Vegan"],
    ingredients: ["Red bell pepper"],
  },
  {
    slug: "fresh-carrots",
    name: "Fresh Carrots",
    category: "Vegetables",
    description: "Crunchy farm carrots, washed and ready to cook or snack on. 1kg bag.",
    priceMinor: 120000,
    stock: 150,
    concern: "Everyday cooking",
    skinTypes: ["Organic", "Vegan"],
    ingredients: ["Carrot"],
  },
  {
    slug: "green-broccoli",
    name: "Green Broccoli",
    category: "Vegetables",
    description: "Firm, deep-green broccoli crowns, harvested fresh. Approx. 500g.",
    priceMinor: 250000,
    stock: 60,
    concern: "Healthy eating",
    skinTypes: ["Organic", "Vegan"],
    ingredients: ["Broccoli"],
  },
  {
    slug: "vine-tomatoes",
    name: "Vine Tomatoes",
    category: "Vegetables",
    description: "Juicy, ripe tomatoes for sauces, stews, and salads. 1kg.",
    priceMinor: 150000,
    stock: 200,
    badge: "Hot",
    concern: "Everyday cooking",
    skinTypes: ["Vegan"],
    ingredients: ["Tomato"],
  },
  {
    slug: "irish-potatoes",
    name: "Irish Potatoes",
    category: "Vegetables",
    description: "All-purpose potatoes for frying, boiling, and mashing. 2kg bag.",
    priceMinor: 220000,
    stock: 90,
    concern: "Everyday cooking",
    skinTypes: ["Vegan", "Gluten-free"],
    ingredients: ["Potato"],
  },
  {
    slug: "sweet-pumpkin",
    name: "Sweet Pumpkin",
    category: "Vegetables",
    description: "Whole sweet pumpkin with dense orange flesh—perfect for soups and roasting.",
    priceMinor: 300000,
    stock: 25,
    concern: "Healthy eating",
    skinTypes: ["Organic", "Vegan"],
    ingredients: ["Pumpkin"],
  },
  {
    slug: "red-apples",
    name: "Red Apples",
    category: "Fruits",
    description: "Crisp, sweet red apples. Pack of 6.",
    priceMinor: 350000,
    stock: 80,
    badge: "New",
    concern: "Snacking",
    skinTypes: ["Vegan", "Gluten-free"],
    ingredients: ["Apple"],
  },
  {
    slug: "ripe-bananas",
    name: "Ripe Bananas",
    category: "Fruits",
    description: "Naturally sweet bananas, perfect for breakfast and smoothies. One bunch.",
    priceMinor: 150000,
    stock: 100,
    concern: "Snacking",
    skinTypes: ["Vegan", "Gluten-free"],
    ingredients: ["Banana"],
  },
  {
    slug: "fresh-strawberries",
    name: "Fresh Strawberries",
    category: "Fruits",
    description: "Hand-picked strawberries, sweet and fragrant. 250g punnet.",
    priceMinor: 400000,
    stock: 40,
    badge: "Sale 10%",
    concern: "Desserts",
    skinTypes: ["Vegan", "Gluten-free"],
    ingredients: ["Strawberry"],
  },
  {
    slug: "hass-avocado",
    name: "Hass Avocado",
    category: "Fruits",
    description: "Creamy, ready-to-eat avocados. Pack of 2.",
    priceMinor: 280000,
    stock: 55,
    concern: "Healthy eating",
    skinTypes: ["Organic", "Vegan"],
    ingredients: ["Avocado"],
  },
  {
    slug: "sourdough-bread",
    name: "Sourdough Bread",
    category: "Bread & Bakery",
    description: "Slow-fermented, crusty sourdough loaf baked fresh every morning.",
    priceMinor: 250000,
    stock: 35,
    badge: "Fresh",
    concern: "Breakfast",
    skinTypes: ["Vegan"],
    ingredients: ["Wheat flour", "Water", "Salt", "Sourdough culture"],
    warnings: "Contains gluten (wheat).",
  },
  {
    slug: "vanilla-cupcakes",
    name: "Vanilla Cupcakes",
    category: "Bread & Bakery",
    description: "Soft vanilla sponge topped with whipped cream frosting. Box of 4.",
    priceMinor: 320000,
    stock: 20,
    concern: "Desserts",
    skinTypes: ["Vegetarian"],
    ingredients: ["Wheat flour", "Sugar", "Eggs", "Butter", "Vanilla"],
    warnings: "Contains gluten, eggs, and milk.",
  },
  {
    slug: "whole-milk",
    name: "Whole Milk 1L",
    category: "Milk & Dairy",
    description: "Creamy full-cream milk, pasteurised for freshness. 1 litre.",
    priceMinor: 190000,
    stock: 70,
    concern: "Breakfast",
    skinTypes: ["Vegetarian", "Gluten-free"],
    ingredients: ["Cow's milk"],
    warnings: "Contains milk.",
  },
  {
    slug: "farm-fresh-eggs",
    name: "Farm Fresh Eggs",
    category: "Milk & Dairy",
    description: "Free-range brown eggs from local farms. Crate of 12.",
    priceMinor: 420000,
    stock: 60,
    badge: "Bestseller",
    concern: "Breakfast",
    skinTypes: ["Vegetarian", "High protein"],
    ingredients: ["Eggs"],
    warnings: "Contains eggs.",
  },
  {
    slug: "orange-juice",
    name: "Fresh Orange Juice",
    category: "Drinks",
    description: "Cold-pressed orange juice with no added sugar. 1 litre.",
    priceMinor: 260000,
    stock: 45,
    concern: "Breakfast",
    skinTypes: ["Vegan", "Gluten-free"],
    ingredients: ["Oranges"],
  },
  {
    slug: "almond-milk-chocolate",
    name: "Almond Milk Chocolate",
    category: "Snacks & Sweets",
    description: "Smooth milk chocolate with roasted almond pieces. 100g bar.",
    priceMinor: 210000,
    stock: 85,
    concern: "Snacking",
    skinTypes: ["Vegetarian"],
    ingredients: ["Cocoa", "Milk", "Sugar", "Almonds"],
    warnings: "Contains milk and nuts.",
  },
];

const USAGE_DEFAULT = "Store in a cool, dry place. Wash fresh produce before eating.";
const WARNINGS_DEFAULT = "Check the ingredient list for allergens before consuming.";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function seedCatalog(prisma: PrismaClient, tenantId: string) {
  for (const catName of CATEGORIES) {
    await prisma.category.upsert({
      where: { tenantId_slug: { tenantId, slug: slugify(catName) } },
      update: { name: catName, active: true },
      create: { tenantId, name: catName, slug: slugify(catName), active: true },
    });
  }

  for (const p of PRODUCTS) {
    const category = await prisma.category.findFirst({
      where: { tenantId, name: p.category },
    });

    const product = await prisma.product.upsert({
      where: { tenantId_slug: { tenantId, slug: p.slug } },
      update: {
        name: p.name,
        shortDescription: p.description,
        description: p.description,
        status: p.status ?? "ACTIVE",
        priceMinor: p.priceMinor,
        stock: p.stock,
        categoryId: category?.id ?? null,
        routineStep: p.routineStep ?? null,
        badge: p.badge ?? null,
        usageInstructions: p.usageInstructions ?? USAGE_DEFAULT,
        warnings: p.warnings ?? WARNINGS_DEFAULT,
        featured: Boolean(p.badge),
      },
      create: {
        tenantId,
        slug: p.slug,
        name: p.name,
        shortDescription: p.description,
        description: p.description,
        status: p.status ?? "ACTIVE",
        priceMinor: p.priceMinor,
        stock: p.stock,
        categoryId: category?.id ?? null,
        routineStep: p.routineStep ?? null,
        badge: p.badge ?? null,
        usageInstructions: p.usageInstructions ?? USAGE_DEFAULT,
        warnings: p.warnings ?? WARNINGS_DEFAULT,
        featured: Boolean(p.badge),
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.create({
      data: {
        tenantId,
        productId: product.id,
        url: catalogImageForProduct(p.slug, p.category),
        alt: p.name,
        sortOrder: 0,
      },
    });

    await prisma.productIngredient.deleteMany({ where: { productId: product.id } });
    for (const ing of p.ingredients) {
      const ingredient = await prisma.ingredient.upsert({
        where: { tenantId_slug: { tenantId, slug: slugify(ing) } },
        update: { name: ing },
        create: { tenantId, name: ing, slug: slugify(ing) },
      });
      await prisma.productIngredient.create({
        data: { productId: product.id, ingredientId: ingredient.id },
      });
    }

    await prisma.productSkinType.deleteMany({ where: { productId: product.id } });
    for (const st of p.skinTypes) {
      const skinType = await prisma.skinType.upsert({
        where: { tenantId_slug: { tenantId, slug: slugify(st) } },
        update: { name: st },
        create: { tenantId, name: st, slug: slugify(st) },
      });
      await prisma.productSkinType.create({
        data: { productId: product.id, skinTypeId: skinType.id },
      });
    }

    await prisma.productConcern.deleteMany({ where: { productId: product.id } });
    const concern = await prisma.skinConcern.upsert({
      where: { tenantId_slug: { tenantId, slug: slugify(p.concern) } },
      update: { name: p.concern },
      create: { tenantId, name: p.concern, slug: slugify(p.concern) },
    });
    await prisma.productConcern.create({
      data: { productId: product.id, concernId: concern.id },
    });
  }
}
