import { DomainEventTypes, onDomainEvent, type DomainEventType } from "@/lib/events/domain-events";
import { processAutomationTriggersForDomainEvent } from "@/modules/automations/automation-trigger.service";
import { triggerTypeForDomainEvent } from "@/modules/automations/types/triggers";

let registered = false;

const AUTOMATION_EVENT_TYPES = (Object.values(DomainEventTypes) as DomainEventType[]).filter(
  (type) => triggerTypeForDomainEvent(type) !== null,
);

export function registerAutomationDomainHandlers() {
  if (registered) return;
  registered = true;

  for (const type of AUTOMATION_EVENT_TYPES) {
    onDomainEvent(type, async (event) => {
      await processAutomationTriggersForDomainEvent(event);
    });
  }
}
