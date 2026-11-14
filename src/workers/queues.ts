import { Queue, Worker, type Job } from "bullmq";

import { getEnv } from "@/config/env";
import { logger } from "@/lib/logger/logger";
import { getRedis } from "@/lib/redis/client";

export const QueueNames = {
  notifications: "notifications",
  automations: "automations",
  analytics: "analytics",
} as const;

export type QueueName = (typeof QueueNames)[keyof typeof QueueNames];

function connectionFromEnv() {
  const url = getEnv().REDIS_URL;
  if (!url) return null;
  return { url };
}

export function createQueue(name: QueueName): Queue | null {
  const connection = connectionFromEnv();
  if (!connection) return null;
  return new Queue(name, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  });
}

export function registerWorker(
  name: QueueName,
  processor: (job: Job) => Promise<void>,
): Worker | null {
  const connection = connectionFromEnv();
  if (!connection) return null;

  const worker = new Worker(name, processor, { connection });
  worker.on("completed", (job) => {
    logger.info("job_completed", { operation: name }, { jobId: job.id });
  });
  worker.on("failed", (job, err) => {
    logger.error("job_failed", { operation: name }, { jobId: job?.id, error: err.message });
  });
  return worker;
}

/** Phase 0 placeholder processors — replace in later phases. */
export function startFoundationWorkers() {
  getRedis()
    ?.connect()
    .catch(() => undefined);

  registerWorker(QueueNames.notifications, async (job) => {
    if (job.name === "deliver") {
      const { processNotificationDelivery } =
        await import("@/modules/notifications/notification-delivery.service");
      const data = job.data as { notificationId: string };
      await processNotificationDelivery(data.notificationId);
    }
  });
  registerWorker(QueueNames.automations, async (job) => {
    if (job.name === "execute") {
      const { executeAutomationRun } =
        await import("@/modules/automations/automation-executor.service");
      const data = job.data as { runId: string; fromStepIndex?: number };
      await executeAutomationRun(data.runId, data.fromStepIndex ?? 0);
    }
  });
  registerWorker(QueueNames.analytics, async () => undefined);

  logger.info("workers_registered", { operation: "bullmq" });
}
