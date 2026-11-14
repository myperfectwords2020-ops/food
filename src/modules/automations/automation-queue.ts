export type AutomationJobPayload = {
  runId: string;
  tenantId: string;
  fromStepIndex?: number | undefined;
};

export type AutomationDelayJobPayload = AutomationJobPayload & {
  resumeAt: string;
};

/** Enqueue via BullMQ worker process — dynamic import keeps BullMQ out of the Next bundle. */
export async function enqueueAutomationExecution(payload: AutomationJobPayload, delayMs = 0) {
  try {
    const { createQueue, QueueNames } = await import("@/workers/queues");
    const queue = createQueue(QueueNames.automations);
    if (!queue) return false;
    await queue.add("execute", payload, delayMs > 0 ? { delay: delayMs } : {});
    return true;
  } catch {
    return false;
  }
}
