export type NotificationDeliveryJob = {
  notificationId: string;
  tenantId: string;
};

export async function enqueueNotificationDelivery(payload: NotificationDeliveryJob) {
  try {
    const { createQueue, QueueNames } = await import("@/workers/queues");
    const queue = createQueue(QueueNames.notifications);
    if (!queue) return false;
    await queue.add("deliver", payload);
    return true;
  } catch {
    return false;
  }
}
