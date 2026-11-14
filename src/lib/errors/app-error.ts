export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PAYMENT_ERROR"
  | "EXTERNAL_SERVICE_ERROR"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly expose: boolean;
  readonly details?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    options?: { status?: number; expose?: boolean; details?: unknown; cause?: unknown },
  ) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = "AppError";
    this.code = code;
    this.status = options?.status ?? AppError.defaultStatus(code);
    this.expose = options?.expose ?? code !== "INTERNAL_ERROR";
    this.details = options?.details;
  }

  static defaultStatus(code: ErrorCode): number {
    switch (code) {
      case "VALIDATION_ERROR":
        return 400;
      case "AUTHENTICATION_ERROR":
        return 401;
      case "AUTHORIZATION_ERROR":
        return 403;
      case "NOT_FOUND":
        return 404;
      case "CONFLICT":
        return 409;
      case "PAYMENT_ERROR":
        return 402;
      case "EXTERNAL_SERVICE_ERROR":
        return 502;
      default:
        return 500;
    }
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.expose ? this.message : "An unexpected error occurred.",
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super("VALIDATION_ERROR", message, { status: 400, expose: true, details });
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required.") {
    super("AUTHENTICATION_ERROR", message, { status: 401, expose: true });
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "You do not have permission to perform this action.") {
    super("AUTHORIZATION_ERROR", message, { status: 403, expose: true });
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found.") {
    super("NOT_FOUND", message, { status: 404, expose: true });
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super("CONFLICT", message, { status: 409, expose: true });
    this.name = "ConflictError";
  }
}

export class PaymentError extends AppError {
  constructor(message: string, details?: unknown) {
    super("PAYMENT_ERROR", message, { status: 402, expose: true, details });
    this.name = "PaymentError";
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, cause?: unknown) {
    super("EXTERNAL_SERVICE_ERROR", message, { status: 502, expose: false, cause });
    this.name = "ExternalServiceError";
  }
}

export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  return new AppError("INTERNAL_ERROR", "Internal server error.", { expose: false, cause: error });
}
