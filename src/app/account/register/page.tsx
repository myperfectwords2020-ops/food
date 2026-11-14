import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/account/auth-forms";
import { AuthPageShell } from "@/components/account/auth-page-shell";
import { getSessionUser } from "@/lib/auth/index";
import { homePathForRole } from "@/lib/auth/post-auth-redirect";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Create account", "Join Greencart.");

export default async function AccountRegisterPage() {
  const user = await getSessionUser();
  if (user) {
    redirect(homePathForRole(user.role));
  }

  return (
    <AuthPageShell
      title="Create your account"
      lede="Join Greencart to save your details and shop fresh groceries in minutes."
    >
      <RegisterForm />
    </AuthPageShell>
  );
}
