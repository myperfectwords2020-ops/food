export async function register() {
  if (process.env["NEXT_RUNTIME"] === "nodejs") {
    const { validateEnv } = await import("@/config/env");
    validateEnv({ strict: false });
    const { registerLeadDomainHandlers } = await import("@/modules/leads/register-domain-handlers");
    registerLeadDomainHandlers();
    const { registerAutomationDomainHandlers } =
      await import("@/modules/automations/register-automation-domain-handlers");
    registerAutomationDomainHandlers();
    const { registerNotificationDomainHandlers } = await import(
      "@/modules/notifications/register-notification-domain-handlers"
    );
    registerNotificationDomainHandlers();
    const { registerAnalyticsDomainHandlers } = await import(
      "@/modules/analytics/register-analytics-domain-handlers"
    );
    registerAnalyticsDomainHandlers();
  }
}
