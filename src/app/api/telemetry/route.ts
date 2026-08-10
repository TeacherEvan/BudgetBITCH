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

const Field = z.record(z.string(), z.unknown());

const LogEvent = z.object({
  ts: z.string(),
  level: z.enum(["debug", "info", "warn", "error"]),
  event: z.string(),
  service: z.string(),
  sessionId: z.string(),
  traceId: z.string().optional(),
}).catchall(Field);

const MetricEvent = z.object({
  ts: z.string(),
  service: z.string(),
  sessionId: z.string(),
  traceId: z.string().optional(),
  metric: z.string(),
  value: z.number(),
  unit: z.enum(["ms", "count", "ratio", "bytes"]),
  tags: z.record(z.string(), z.string()).optional(),
});

const Batch = z.object({
  logs: z.array(LogEvent).max(500).optional(),
  metrics: z.array(MetricEvent).max(500).optional(),
});

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
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
