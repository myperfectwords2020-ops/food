import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Boxes,
  ChartColumn,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  ShoppingBag,
  UserRound,
  Users,
  Truck,
  Workflow,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const adminNav: AdminNavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/delivery", label: "Delivery", icon: Truck },
  { href: "/admin/customers", label: "Customers", icon: UserRound },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/admin/ai", label: "AI", icon: Bot },
  { href: "/admin/automations", label: "Automations", icon: Workflow },
  { href: "/admin/analytics", label: "Analytics", icon: ChartColumn },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];
