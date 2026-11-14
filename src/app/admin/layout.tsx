import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireSessionUser } from "@/lib/auth/index";
import { requireStaff } from "@/lib/auth/authorize";
import { canAccessAdminArea } from "@/lib/auth/permissions";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireSessionUser();
  if (!canAccessAdminArea(user.role)) {
    redirect("/access-denied");
  }
  requireStaff(user);
  return <AdminShell>{children}</AdminShell>;
}
