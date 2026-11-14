import { getRedis } from "@/lib/redis/client";

/** Token-bucket style limiter (foundation). Returns true if allowed. */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return true;

  const bucketKey = `rl:${key}`;
  const current = await redis.incr(bucketKey);
  if (current === 1) {
    await redis.expire(bucketKey, windowSeconds);
  }
  return current <= limit;
}
