import Redis from "ioredis";

import { getEnv } from "@/config/env";
import { logger } from "@/lib/logger/logger";

let client: Redis | null = null;

export function getRedis(): Redis | null {
  const url = getEnv().REDIS_URL;
  if (!url) return null;
  if (!client) {
    client = new Redis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: true,
    });
    client.on("error", (err) => {
      logger.error("Redis connection error", { operation: "redis" }, { name: err.name });
    });
  }
  return client;
}

export async function disconnectRedis() {
  if (client) {
    await client.quit();
    client = null;
  }
}
