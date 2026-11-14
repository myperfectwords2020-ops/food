import { ValidationError } from "@/lib/errors/app-error";

export type ConditionOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "greaterThan"
  | "greaterThanOrEqual"
  | "lessThan"
  | "lessThanOrEqual"
  | "exists"
  | "notExists"
  | "in"
  | "notIn";

export type ConditionRule = {
  field: string;
  operator: ConditionOperator;
  value?: unknown;
};

export type ConditionGroup = {
  all?: ConditionRule[] | undefined;
  any?: ConditionRule[] | undefined;
};

const OPERATORS: ConditionOperator[] = [
  "equals",
  "notEquals",
  "contains",
  "notContains",
  "greaterThan",
  "greaterThanOrEqual",
  "lessThan",
  "lessThanOrEqual",
  "exists",
  "notExists",
  "in",
  "notIn",
];

function resolveField(context: Record<string, unknown>, field: string): unknown {
  const parts = field.split(".");
  let current: unknown = context;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function compare(rule: ConditionRule, actual: unknown): boolean {
  switch (rule.operator) {
    case "exists":
      return actual !== undefined && actual !== null;
    case "notExists":
      return actual === undefined || actual === null;
    case "equals":
      return actual === rule.value;
    case "notEquals":
      return actual !== rule.value;
    case "contains":
      return typeof actual === "string" && typeof rule.value === "string"
        ? actual.includes(rule.value)
        : false;
    case "notContains":
      return typeof actual === "string" && typeof rule.value === "string"
        ? !actual.includes(rule.value)
        : true;
    case "greaterThan":
      return Number(actual) > Number(rule.value);
    case "greaterThanOrEqual":
      return Number(actual) >= Number(rule.value);
    case "lessThan":
      return Number(actual) < Number(rule.value);
    case "lessThanOrEqual":
      return Number(actual) <= Number(rule.value);
    case "in":
      return Array.isArray(rule.value) ? rule.value.includes(actual) : false;
    case "notIn":
      return Array.isArray(rule.value) ? !rule.value.includes(actual) : true;
    default:
      return false;
  }
}

export function evaluateConditionGroup(
  group: ConditionGroup,
  context: Record<string, unknown>,
): boolean {
  if (group.all?.length) {
    return group.all.every((rule) => compare(rule, resolveField(context, rule.field)));
  }
  if (group.any?.length) {
    return group.any.some((rule) => compare(rule, resolveField(context, rule.field)));
  }
  return true;
}

export function parseConditionGroup(raw: unknown): ConditionGroup {
  if (!raw || typeof raw !== "object") {
    throw new ValidationError("Invalid condition configuration.");
  }
  const obj = raw as ConditionGroup;
  const rules = [...(obj.all ?? []), ...(obj.any ?? [])];
  for (const rule of rules) {
    if (!rule.field || !OPERATORS.includes(rule.operator)) {
      throw new ValidationError("Invalid condition rule.");
    }
  }
  return obj;
}
