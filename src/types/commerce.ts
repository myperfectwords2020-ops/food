export type ProductShadeOption = { name: string; hex: string };

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
  shadeOptions?: ProductShadeOption[];
  usageInstructions?: string;
  warnings?: string;
  createdAt?: string;
};

export type CartLineInput = {
  productId: string;
  quantity: number;
};

export type CartLine = CartLineInput & {
  name: string;
  slug: string;
  image: string;
  unitPrice: number;
  lineTotal: number;
  maxQuantity: number;
};

export type CartSummary = {
  lines: CartLine[];
  subtotal: number;
  delivery: number | null;
  discount: number;
  total: number;
  currency: "NGN";
};

export type ProductSort = "featured" | "price-asc" | "price-desc" | "newest";

export type ProductFilters = {
  q?: string;
  category?: string;
  skinType?: string;
  concern?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
};

export type ProductListResult = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type RoutineAnswers = {
  skinType: string;
  concern: string;
  currentRoutine: string;
  preferences: string;
  budget: string;
  goals: string;
};

export type RoutineRecommendation = {
  products: Product[];
  morningSteps: string[];
  eveningSteps: string[];
  guidanceNote: string;
};

export type CheckoutCustomer = {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
};

export type CheckoutAddress = {
  street: string;
  city: string;
  state: string;
};

export type CheckoutInput = {
  lines: CartLineInput[];
  customer: CheckoutCustomer;
  address: CheckoutAddress;
  deliveryMethod: "standard";
};

export type OrderStatus =
  "pending_payment" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

export type Order = {
  id: string;
  orderNumber?: string | undefined;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: "pending" | "paid" | "failed";
  customer: CheckoutCustomer;
  address: CheckoutAddress;
  lines: CartLine[];
  summary: CartSummary;
  deliveryEstimate?: string;
};

export type AccountProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type AccountAddress = {
  id: string;
  label: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  phone?: string | undefined;
  street: string;
  line2?: string | undefined;
  city: string;
  state: string;
  postalCode?: string | undefined;
  country?: string | undefined;
  isDefault: boolean;
};

export type AccountPreferences = {
  emailOffers: boolean;
  smsUpdates: boolean;
  whatsappOffers: boolean;
  fragranceFree: boolean;
  routineReminders: boolean;
  communicationChannel?: "email" | "sms" | "whatsapp" | undefined;
};

export type AccountRecommendationSet = {
  id: string;
  createdAt: string;
  products: { slug: string; name: string; reasons: string[] }[];
};

export type AccountOrderSummary = {
  id: string;
  orderNumber?: string | undefined;
  date: string;
  status: OrderStatus;
  paymentStatus: Order["paymentStatus"];
  total: number;
  itemCount: number;
};
