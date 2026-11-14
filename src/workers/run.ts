/**
 * Standalone worker process entry (Phase 0 foundation).
 * Run: npm run worker
 */
import { validateEnv } from "@/config/env";
import { startFoundationWorkers } from "@/workers/queues";

validateEnv({ strict: process.env["NODE_ENV"] === "production" });

startFoundationWorkers();

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));
