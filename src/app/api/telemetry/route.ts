import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

// Sink for structured client telemetry (logs + metrics) emitted from
// src/lib/observability/logger.ts via sendBeacon. Mirrors /api/vitals:
// we validate shape, re-emit as structured JSON to the server logs, and
// acknowledge. We deliberately do NOT persist to Convex (keep the write path
// out of the hot client loop; the Convex side already logs server-side).
//
// The re-emitted JSON is queryable in Vercel/Next logs alongside Convex logs,
// giving one correlated view of a request that crosses both runtimes.
//
// This endpoint is unauthenticated, so the body is bounded in bytes, every
// string field is length-bounded, and a small per-session rate limit prevents
// a single client from flooding the server logs.

const MAX_BODY_BYTES = 32 * 1024;
const MAX_ITEMS_PER_BATCH = 100;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_PER_WINDOW = 120;

const boundedString = (max: number) => z.string().max(max);
const ID_MAX = 128;

const LogEvent = z.object({
  ts: boundedString(64),
  level: z.enum(["debug", "info", "warn", "error"]),
  event: boundedString(128),
  service: boundedString(128),
  sessionId: boundedString(ID_MAX),
  traceId: boundedString(ID_MAX).optional(),
  // The client logger spreads arbitrary structured fields into every event
  // (see src/lib/observability/types.ts's LogEvent index signature), so the
  // catchall must stay for compatibility. The 32 KB body cap above is what
  // bounds it; unknown keys are never allowed to reach a hard limit on their
  // own.
}).catchall(z.unknown());

const MetricEvent = z.object({
  ts: boundedString(64),
  service: boundedString(128),
  sessionId: boundedString(ID_MAX),
  traceId: boundedString(ID_MAX).optional(),
  metric: boundedString(128),
  value: z.number(),
  unit: z.enum(["ms", "count", "ratio", "bytes"]),
  tags: z.record(boundedString(128), boundedString(256)).optional(),
}).strict();

const Batch = z.object({
  logs: z.array(LogEvent).max(MAX_ITEMS_PER_BATCH).optional(),
  metrics: z.array(MetricEvent).max(MAX_ITEMS_PER_BATCH).optional(),
}).strict();

// Best-effort in-memory limit: serverless instances are ephemeral, but this
// still stops a single noisy session from flooding one warm instance.
type RateState = { count: number; resetAt: number };
const rateState = new Map<string, RateState>();

function rateKey(req: NextRequest, data: z.infer<typeof Batch>): string {
  const sessionId = data.logs?.[0]?.sessionId ?? data.metrics?.[0]?.sessionId;
  if (sessionId) return `session:${sessionId}`;
  const origin = req.headers.get("origin") ?? req.headers.get("x-forwarded-for");
  return `origin:${origin ?? "anonymous"}`;
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const state = rateState.get(key);
  if (!state || now >= state.resetAt) {
    // Opportunistic cleanup keeps the map from growing without bound.
    if (rateState.size > 1000) {
      for (const [k, v] of rateState) if (now >= v.resetAt) rateState.delete(k);
    }
    rateState.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (state.count >= RATE_MAX_PER_WINDOW) return true;
  state.count += 1;
  return false;
}

export async function POST(req: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: "Unreadable request body" }, { status: 400 });
  }
  if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Telemetry payload too large" }, { status: 413 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = Batch.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid telemetry payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (isRateLimited(rateKey(req, parsed.data))) {
    return NextResponse.json({ error: "Too many telemetry requests" }, { status: 429 });
  }

  const { logs, metrics } = parsed.data;
  // Re-emit each structured event to the server log so it shows up in the
  // platform's log search alongside Convex-side events.
  for (const l of logs ?? []) {
    const line = JSON.stringify(l);
    if (l.level === "error") console.error(line);
    else if (l.level === "warn") console.warn(line);
    else console.log(line);
  }
  for (const m of metrics ?? []) {
    console.log(JSON.stringify({ ...m, kind: "metric" }));
  }

  return new NextResponse(null, { status: 204 });
}

// Allow the beacon preflight without auth.
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
