import { getEnv } from "@/config/env";

export type LogContext = {
  requestId?: string | undefined;
  userId?: string | undefined;
  tenantId?: string | undefined;
  operation?: string | undefined;
  durationMs?: number | undefined;
  errorCode?: string | undefined;
};

const REDACT_KEYS = /password|secret|token|authorization|api[_-]?key|cookie/i;

function sanitize(meta: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (REDACT_KEYS.test(key)) {
      out[key] = "[REDACTED]";
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = sanitize(value as Record<string, unknown>);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function log(level: string, message: string, context?: LogContext, meta?: Record<string, unknown>) {
  const env = getEnv();
  const levels = ["debug", "info", "warn", "error"];
  if (levels.indexOf(level) < levels.indexOf(env.LOG_LEVEL)) return;

  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
    ...(meta ? sanitize(meta) : {}),
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, context?: LogContext, meta?: Record<string, unknown>) =>
    log("debug", message, context, meta),
  info: (message: string, context?: LogContext, meta?: Record<string, unknown>) =>
    log("info", message, context, meta),
  warn: (message: string, context?: LogContext, meta?: Record<string, unknown>) =>
    log("warn", message, context, meta),
  error: (message: string, context?: LogContext, meta?: Record<string, unknown>) =>
    log("error", message, context, meta),
};
