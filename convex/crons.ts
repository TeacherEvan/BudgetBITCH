// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Clean up expired idempotency records (> 7 days) once a day
crons.daily(
  "cleanup-processed-webhooks",
  { hourUTC: 3, minuteUTC: 0 },
  internal.line.cleanupProcessedWebhooks,
);

export default crons;
