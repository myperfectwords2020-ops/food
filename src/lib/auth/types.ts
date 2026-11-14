import type { Role } from "@prisma/client";

import type { Permission } from "@/lib/auth/permissions";

export type RequestContext = {
  userId: string;
  email: string;
  role: Role;
  tenantId: string | null;
  permissions: readonly Permission[];
  customerId: string | null;
};
