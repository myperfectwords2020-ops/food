const ALLOWED_PATHS = new Set([
  "customer.firstName",
  "customer.lastName",
  "customer.email",
  "order.orderNumber",
  "order.total",
  "order.status",
  "tracking.url",
  "message.body",
]);

const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

function resolvePath(context: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = context;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") return "";
    current = (current as Record<string, unknown>)[part];
  }
  if (current === null || current === undefined) return "";
  return String(current);
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function validateTemplateVariables(body: string, subject?: string | null): string[] {
  const unknown: string[] = [];
  const scan = (text: string) => {
    for (const match of text.matchAll(VARIABLE_PATTERN)) {
      const path = match[1];
      if (path && !ALLOWED_PATHS.has(path)) unknown.push(path);
    }
  };
  scan(body);
  if (subject) scan(subject);
  return unknown;
}

export function renderTemplate(
  template: { subject?: string | null; body: string },
  context: Record<string, unknown>,
  options?: { html?: boolean },
): { subject?: string; bodyText: string; bodyHtml?: string } {
  const render = (text: string) =>
    text.replace(VARIABLE_PATTERN, (_m, path: string) => {
      if (!ALLOWED_PATHS.has(path)) return "";
      const value = String(resolvePath(context, path));
      return options?.html ? escapeHtml(value) : value;
    });

  const bodyText = render(template.body);
  const subject = template.subject ? render(template.subject) : undefined;
  if (options?.html) {
    return {
      ...(subject ? { subject } : {}),
      bodyText,
      bodyHtml: `<p>${bodyText.replace(/\n/g, "<br/>")}</p>`,
    };
  }
  return { ...(subject ? { subject } : {}), bodyText };
}
