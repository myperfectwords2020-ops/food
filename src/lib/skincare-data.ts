import { catalogImageForProduct } from "@/config/catalog-images";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  concern: string;
  skinTypes: string[];
  ingredients: string[];
  stock: number;
  badge?: string;
};

export const products: Product[] = [
  {
    id: "p1",
    slug: "hydrating-cleanser",
    name: "Dewdrop Hydrating Cleanser",
    category: "Cleanser",
    description: "A gentle, low-foam daily cleanse that leaves skin feeling comfortable.",
    price: 12500,
    image: catalogImageForProduct("hydrating-cleanser", "Cleanser"),
    concern: "Dryness",
    skinTypes: ["Dry", "Sensitive"],
    ingredients: ["Glycerin", "Oat extract"],
    stock: 48,
    badge: "Bestseller",
  },
  {
    id: "p2",
    slug: "vitamin-c-brightening-serum",
    name: "Daylight Vitamin C Serum",
    category: "Serum",
    description: "A lightweight antioxidant serum formulated for dull, uneven-looking skin.",
    price: 18500,
    image: catalogImageForProduct("vitamin-c-brightening-serum", "Serum"),
    concern: "Dark Spots",
    skinTypes: ["Normal", "Combination"],
    ingredients: ["Vitamin C", "Ferulic acid"],
    stock: 26,
    badge: "Editor’s pick",
  },
  {
    id: "p3",
    slug: "niacinamide-balance-serum",
    name: "Balance Niacinamide Serum",
    category: "Serum",
    description: "A calm, water-light serum for the look of excess oil and uneven texture.",
    price: 16000,
    image: catalogImageForProduct("niacinamide-balance-serum", "Serum"),
    concern: "Uneven Texture",
    skinTypes: ["Oily", "Combination"],
    ingredients: ["Niacinamide", "Zinc PCA"],
    stock: 8,
  },
  {
    id: "p4",
    slug: "barrier-repair-moisturizer",
    name: "Cloudveil Barrier Moisturizer",
    category: "Moisturizer",
    description: "A comforting cream that supports the skin barrier without feeling heavy.",
    price: 21000,
    image: catalogImageForProduct("barrier-repair-moisturizer", "Moisturizer"),
    concern: "Dryness",
    skinTypes: ["All skin types"],
    ingredients: ["Ceramides", "Squalane"],
    stock: 34,
  },
  {
    id: "p5",
    slug: "daily-sunscreen",
    name: "Sunroom Daily SPF 50",
    category: "Sunscreen",
    description: "Broad-spectrum daily protection with an invisible, comfortable finish.",
    price: 19500,
    image: catalogImageForProduct("daily-sunscreen", "Sunscreen"),
    concern: "Dullness",
    skinTypes: ["All skin types"],
    ingredients: ["UV filters", "Vitamin E"],
    stock: 62,
    badge: "New",
  },
  {
    id: "p6",
    slug: "gentle-exfoliating-toner",
    name: "Soft Reset Exfoliating Toner",
    category: "Toner",
    description: "A measured exfoliating step for smoother, more luminous-looking skin.",
    price: 14500,
    image: catalogImageForProduct("gentle-exfoliating-toner", "Toner"),
    concern: "Uneven Texture",
    skinTypes: ["Oily", "Normal"],
    ingredients: ["PHA", "Aloe"],
    stock: 17,
  },
  {
    id: "p7",
    slug: "velvet-matte-lipstick",
    name: "Velvet Matte Lipstick",
    category: "Lipstick",
    description: "Rich pigment with a soft matte finish that stays comfortable through the day.",
    price: 9800,
    image: catalogImageForProduct("velvet-matte-lipstick", "Lipstick"),
    concern: "Color payoff",
    skinTypes: ["All skin tones"],
    ingredients: ["Shea butter", "Vitamin E"],
    stock: 120,
    badge: "12 shades",
  },
  {
    id: "p8",
    slug: "evening-orchid-parfum",
    name: "Evening Orchid Parfum",
    category: "Fragrance",
    description: "A velvety floral with black orchid, smoked vanilla, and sandalwood.",
    price: 24500,
    image: catalogImageForProduct("evening-orchid-parfum", "Fragrance"),
    concern: "Evening wear",
    skinTypes: ["All"],
    ingredients: ["Black orchid", "Madagascar vanilla"],
    stock: 40,
    badge: "Eau de parfum",
  },
];

export const formatNaira = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);

export const orders = [
  {
    id: "SK-1048",
    customer: "Amara Okoye",
    items: 3,
    amount: 54000,
    status: "Processing",
    payment: "Paid",
    date: "Today, 09:42",
  },
  {
    id: "SK-1047",
    customer: "Tomi Adeyemi",
    items: 2,
    amount: 33500,
    status: "Shipped",
    payment: "Paid",
    date: "Today, 08:16",
  },
  {
    id: "SK-1046",
    customer: "Nneka Udo",
    items: 1,
    amount: 21000,
    status: "Delivered",
    payment: "Paid",
    date: "Yesterday",
  },
  {
    id: "SK-1045",
    customer: "Zainab Bello",
    items: 4,
    amount: 68000,
    status: "Awaiting",
    payment: "Pending",
    date: "Yesterday",
  },
];

export const customers = [
  {
    name: "Amara Okoye",
    email: "amara@example.com",
    phone: "+234 803 555 0148",
    orders: 8,
    spent: 214500,
    lifecycle: "Loyal",
    activity: "2h ago",
  },
  {
    name: "Tomi Adeyemi",
    email: "tomi@example.com",
    phone: "+234 806 555 0912",
    orders: 3,
    spent: 87500,
    lifecycle: "Active",
    activity: "Today",
  },
  {
    name: "Nneka Udo",
    email: "nneka@example.com",
    phone: "+234 708 555 1155",
    orders: 1,
    spent: 21000,
    lifecycle: "New",
    activity: "Yesterday",
  },
];

export const leads = [
  {
    name: "Efe Williams",
    source: "Routine quiz",
    interest: "Brightening routine",
    concern: "Dark spots",
    stage: "New",
    owner: "Maya",
    activity: "12 min",
  },
  {
    name: "Ifeoma Chukwu",
    source: "AI assistant",
    interest: "Sensitive cleanser",
    concern: "Dryness",
    stage: "Contacted",
    owner: "Ada",
    activity: "1h",
  },
  {
    name: "Kemi Lawal",
    source: "Newsletter",
    interest: "Complete routine",
    concern: "Texture",
    stage: "Qualified",
    owner: "Maya",
    activity: "Yesterday",
  },
  {
    name: "Sarah Peters",
    source: "Instagram",
    interest: "Sun protection",
    concern: "Dullness",
    stage: "Converted",
    owner: "Ada",
    activity: "2d",
  },
];
