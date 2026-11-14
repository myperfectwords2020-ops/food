import { AssistantChat } from "@/components/assistant/assistant-chat";
import { getRequestContext } from "@/lib/auth/request-context";
import { pageMetadata } from "@/lib/seo";
import { accountService } from "@/services/index";

export const metadata = pageMetadata(
  "Shopping assistant",
  "Ask the Greencart assistant to find groceries, compare products, plan meals from what's in stock, and check your orders.",
);

export default async function AssistantPage() {
  const ctx = await getRequestContext();
  let customerName: string | undefined;
  if (ctx?.role === "CUSTOMER" && ctx.customerId) {
    try {
      const profile = await accountService.getProfile();
      customerName =
        [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() || profile.email;
    } catch {
      customerName = ctx.email ?? undefined;
    }
  }

  return (
    <div className="page-shell assistant-page-shell">
      <header className="page-intro mb-6">
        <div>
          <p className="eyebrow">Shopping assistant</p>
          <h1>Ask AI.</h1>
          <p className="text-muted-foreground leading-7 max-w-2xl">
            Find groceries, compare products, get meal ideas from what&apos;s in stock, and check
            your orders. Prices and stock come from our live catalog; the assistant can&apos;t
            change orders or payments from chat.
          </p>
        </div>
      </header>
      <AssistantChat mode="page" customerName={customerName} />
    </div>
  );
}
