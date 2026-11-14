import { redirect } from "next/navigation";

import { LoginForm } from "@/components/account/auth-forms";
import { AuthPageShell } from "@/components/account/auth-page-shell";
import { getSessionUser } from "@/lib/auth/index";
import { homePathForRole } from "@/lib/auth/post-auth-redirect";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Sign in", "Access your Greencart account.");

type Props = { searchParams: Promise<{ callbackUrl?: string }> };

export default async function AccountLoginPage({ searchParams }: Props) {
  const user = await getSessionUser();
  if (user) {
    redirect(homePathForRole(user.role));
  }

  const { callbackUrl } = await searchParams;
  return (
    <AuthPageShell
      title="Welcome back"
      lede="Sign in to track orders, manage addresses, and checkout faster."
    >
      <LoginForm callbackUrl={callbackUrl} />
    </AuthPageShell>
  );
}
