// Structured logging for Convex functions.
//
// Convex actions/mutations run server-side; their console output lands in the
// Convex dashboard logs. By emitting JSON with a stable `event` + `fields`
// (never interpolated strings) and a `traceId` per operation, on-call can
// query a single request across the LINE webhook -> receipt ingest -> confirm
// flow. No metrics backend is added (out of scope); structure is the win.
//
// SECURITY: never pass secrets/tokens/raw request bodies into `fields`. Allowlist.
//
// NOTE: kept self-contained (no cross-boundary imports) so the Convex bundler
// stays happy — the LogLevel here mirrors src/lib/observability/types.ts.

const SERVICE = "budget-boss-convex";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface ConvexLogFields {
  [key: string]: unknown;
}

export function clog(
  level: LogLevel,
  event: string,
  fields: ConvexLogFields = {},
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    service: SERVICE,
    ...fields,
  });
  // Route to the matching console level so the dashboard colours/filters apply.
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else if (level === "debug") {
    console.debug(line);
  } else {
    console.log(line);
  }
}

export function clogInfo(event: string, fields?: ConvexLogFields): void {
  clog("info", event, fields);
}
export function clogWarn(event: string, fields?: ConvexLogFields): void {
  clog("warn", event, fields);
}
export function clogError(
  event: string,
  err: unknown,
  fields?: ConvexLogFields,
): void {
  const message = err instanceof Error ? err.message : String(err);
  const errorName = err instanceof Error ? err.name : "Error";
  clog("error", event, { errorName, errorMessage: message, ...fields });
}

/**
 * Emit a RED/USE-style metric as a structured JSON line (kind:"metric") so it
 * is queryable in the Convex logs alongside events. Dimensions must be small,
 * bounded sets (source, status_class, provider) — never user ids or URLs.
 */
export function clogMetric(
  metric: string,
  value: number,
  unit: "ms" | "count" | "ratio" | "bytes",
  tags?: Record<string, string>,
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    service: SERVICE,
    kind: "metric",
    metric,
    value,
    unit,
    tags: tags ?? {},
  });
  console.log(line);
}

/** Stable per-operation correlation id (Web Crypto, with a safe fallback). */
export function genTraceId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}
