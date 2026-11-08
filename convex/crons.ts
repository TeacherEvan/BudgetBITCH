// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Clean up expired idempotency records (> 24 hours) once a day
crons.cron(
  "cleanup-processed-webhooks",
  "0 3 * * *",
  internal.line.cleanupProcessedWebhooks,
  {},
);

export default crons;
