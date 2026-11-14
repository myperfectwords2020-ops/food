import { DomainEventTypes } from "@/lib/events/domain-events";

export const AutomationTriggerTypes = {
  LEAD_CREATED: "LEAD_CREATED",
  LEAD_QUALIFIED: "LEAD_QUALIFIED",
  LEAD_CONVERTED: "LEAD_CONVERTED",
  LEAD_STATUS_CHANGED: "LEAD_STATUS_CHANGED",
  CUSTOMER_CREATED: "CUSTOMER_CREATED",
  CUSTOMER_LIFECYCLE_CHANGED: "CUSTOMER_LIFECYCLE_CHANGED",
  ORDER_CREATED: "ORDER_CREATED",
  ORDER_PAID: "ORDER_PAID",
  ORDER_SHIPPED: "ORDER_SHIPPED",
  ORDER_DELIVERED: "ORDER_DELIVERED",
  CART_ABANDONED: "CART_ABANDONED",
  CONVERSATION_CREATED: "CONVERSATION_CREATED",
  CONVERSATION_HANDOFF_REQUESTED: "CONVERSATION_HANDOFF_REQUESTED",
  CONVERSATION_ASSIGNED: "CONVERSATION_ASSIGNED",
  CONVERSATION_RESOLVED: "CONVERSATION_RESOLVED",
  PRODUCT_LOW_STOCK: "PRODUCT_LOW_STOCK",
  INVENTORY_THRESHOLD_REACHED: "INVENTORY_THRESHOLD_REACHED",
  CUSTOMER_INACTIVE: "CUSTOMER_INACTIVE",
} as const;

export type AutomationTriggerType =
  (typeof AutomationTriggerTypes)[keyof typeof AutomationTriggerTypes];

const DOMAIN_TO_TRIGGER: Partial<Record<string, AutomationTriggerType>> = {
  [DomainEventTypes.LEAD_CREATED]: AutomationTriggerTypes.LEAD_CREATED,
  [DomainEventTypes.LEAD_QUALIFIED]: AutomationTriggerTypes.LEAD_QUALIFIED,
  [DomainEventTypes.LEAD_CONVERTED]: AutomationTriggerTypes.LEAD_CONVERTED,
  [DomainEventTypes.LEAD_STATUS_CHANGED]: AutomationTriggerTypes.LEAD_STATUS_CHANGED,
  [DomainEventTypes.CUSTOMER_CREATED]: AutomationTriggerTypes.CUSTOMER_CREATED,
  [DomainEventTypes.CUSTOMER_LIFECYCLE_CHANGED]: AutomationTriggerTypes.CUSTOMER_LIFECYCLE_CHANGED,
  [DomainEventTypes.ORDER_CREATED]: AutomationTriggerTypes.ORDER_CREATED,
  [DomainEventTypes.ORDER_PAID]: AutomationTriggerTypes.ORDER_PAID,
  [DomainEventTypes.ORDER_SHIPPED]: AutomationTriggerTypes.ORDER_SHIPPED,
  [DomainEventTypes.ORDER_DELIVERED]: AutomationTriggerTypes.ORDER_DELIVERED,
  [DomainEventTypes.CONVERSATION_CREATED]: AutomationTriggerTypes.CONVERSATION_CREATED,
  [DomainEventTypes.CONVERSATION_HANDOFF_REQUESTED]:
    AutomationTriggerTypes.CONVERSATION_HANDOFF_REQUESTED,
  [DomainEventTypes.CONVERSATION_ASSIGNED]: AutomationTriggerTypes.CONVERSATION_ASSIGNED,
  [DomainEventTypes.CONVERSATION_RESOLVED]: AutomationTriggerTypes.CONVERSATION_RESOLVED,
};

export function normalizeTriggerType(input: string): AutomationTriggerType | null {
  const key = input.trim().toUpperCase().replaceAll(".", "_").replaceAll("-", "_");
  if (key in AutomationTriggerTypes) {
    return key as AutomationTriggerType;
  }
  return DOMAIN_TO_TRIGGER[input] ?? DOMAIN_TO_TRIGGER[key] ?? null;
}

export function triggerTypeForDomainEvent(domainType: string): AutomationTriggerType | null {
  return DOMAIN_TO_TRIGGER[domainType] ?? null;
}

export function isRegisteredTrigger(type: string): type is AutomationTriggerType {
  return normalizeTriggerType(type) !== null;
}
