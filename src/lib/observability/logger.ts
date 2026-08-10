"use client";

// Structured client logger + correlation-trace helper + telemetry beacon.
//
// Design goals (per observability-and-instrumentation skill):
//  - Every log line is a stable `event` + structured `fields`, never string
//    interpolation, so on-call can query "what fraction of syncs failed".
//  - A `traceId` correlates every line within one operation (a sync run, a
//    restore) so a single request can be followed end to end.
//  - In production, events are flushed to /api/telemetry via sendBeacon
//    (keepalive) — same pattern as src/lib/web-vitals.ts — so they land in the
//    server logs as structured JSON. In dev they also print to the console.
//  - NEVER include secrets, tokens, or raw PII in `fields`. Allowlist only.

import type { LogEvent, LogLevel, MetricEvent, TelemetryBatch } from "./types";

const SERVICE = "budget-boss-web";
const TELEMETRY_ENDPOINT = "/api/telemetry";
const FLUSH_INTERVAL_MS = 10_000;
const MAX_BUFFER = 200;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function makeId(): string {
  if (isBrowser() && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// sessionId is stable for the page lifetime (sessionStorage survives reloads
// within a tab, which is the right scope for "one browser session").
let sessionId = "";
function getSessionId(): string {
  if (sessionId) return sessionId;
  if (isBrowser()) {
    try {
      const existing = sessionStorage.getItem("bb_session_id");
      if (existing) {
        sessionId = existing;
        return sessionId;
      }
    } catch {
      /* sessionStorage may be unavailable (private mode) — fall through */
    }
  }
  sessionId = makeId();
  if (isBrowser()) {
    try {
      sessionStorage.setItem("bb_session_id", sessionId);
    } catch {
      /* ignore */
    }
  }
  return sessionId;
}

// Correlation stack: withTrace pushes a traceId for its operation's duration.
// A stack (not a single var) keeps nested operations from clobbering each other.
const traceStack: string[] = [];
function currentTraceId(): string | undefined {
  return traceStack[traceStack.length - 1];
}

const buffer: TelemetryBatch = { logs: [], metrics: [] };
let flushTimer: ReturnType<typeof setInterval> | null = null;

function enqueue(log?: LogEvent, metric?: MetricEvent): void {
  if (log) {
    buffer.logs!.push(log);
    if (buffer.logs!.length > MAX_BUFFER) buffer.logs!.shift();
  }
  if (metric) {
    buffer.metrics!.push(metric);
    if (buffer.metrics!.length > MAX_BUFFER) buffer.metrics!.shift();
  }
  if (isBrowser() && buffer.logs!.length + buffer.metrics!.length >= MAX_BUFFER) {
    void flush();
  }
}

export function buildLogEvent(
  level: LogLevel,
  event: string,
  fields: Record<string, unknown> = {},
): LogEvent {
  const evt: LogEvent = {
    ts: new Date().toISOString(),
    level,
    event,
    service: SERVICE,
    sessionId: getSessionId(),
    ...fields,
  };
  const tid = currentTraceId();
  if (tid) evt.traceId = tid;
  return evt;
}

function emit(log: LogEvent): void {
  // Dev: print structured JSON so a developer can read it immediately.
  if (process.env.NODE_ENV !== "production") {
    console[log.level === "debug" ? "debug" : log.level](JSON.stringify(log));
  }
  enqueue(log);
}

export function log(
  level: LogLevel,
  event: string,
  fields?: Record<string, unknown>,
): void {
  emit(buildLogEvent(level, event, fields));
}

export function logDebug(event: string, fields?: Record<string, unknown>): void {
  log("debug", event, fields);
}
export function logInfo(event: string, fields?: Record<string, unknown>): void {
  log("info", event, fields);
}
export function logWarn(event: string, fields?: Record<string, unknown>): void {
  log("warn", event, fields);
}
export function logError(
  event: string,
  err: unknown,
  fields?: Record<string, unknown>,
): void {
  const message = err instanceof Error ? err.message : String(err);
  const errorName = err instanceof Error ? err.name : "Error";
  emit(
    buildLogEvent("error", event, {
      errorName,
      errorMessage: message,
      ...fields,
    }),
  );
}

/** Emit a named metric sample (REDA/USE-style). Tags must be bounded sets. */
export function reportMetric(
  metric: string,
  value: number,
  unit: MetricEvent["unit"],
  tags?: Record<string, string>,
): void {
  const evt: MetricEvent = {
    ts: new Date().toISOString(),
    service: SERVICE,
    sessionId: getSessionId(),
    metric,
    value,
    unit,
    tags,
  };
  const tid = currentTraceId();
  if (tid) evt.traceId = tid;
  if (process.env.NODE_ENV !== "production") {
    console.debug(JSON.stringify(evt));
  }
  enqueue(undefined, evt);
}

/**
 * Wrap an async operation in a correlation trace: generates a traceId, logs
 * start + success/error with duration (ms), and makes the traceId current for
 * every nested log line. Returns the operation's result.
 */
export async function withTrace<T>(
  event: string,
  fields: Record<string, unknown>,
  fn: () => Promise<T>,
): Promise<T> {
  const traceId = makeId();
  traceStack.push(traceId);
  const start = performance.now();
  logInfo(`${event}_started`, fields);
  try {
    const result = await fn();
    const durationMs = Math.round(performance.now() - start);
    reportMetric(`${event}_duration_ms`, durationMs, "ms");
    logInfo(`${event}_succeeded`, { ...fields, durationMs });
    return result;
  } catch (err) {
    const durationMs = Math.round(performance.now() - start);
    reportMetric(`${event}_duration_ms`, durationMs, "ms");
    logError(`${event}_failed`, err, { ...fields, durationMs });
    throw err;
  } finally {
    traceStack.pop();
  }
}

/** Manually flush the buffered telemetry to the server sink. */
export async function flush(): Promise<void> {
  if (!isBrowser()) return;
  const logs = buffer.logs ?? [];
  const metrics = buffer.metrics ?? [];
  if (logs.length === 0 && metrics.length === 0) return;
  buffer.logs = [];
  buffer.metrics = [];

  const payload: TelemetryBatch = { logs, metrics };
  const body = JSON.stringify(payload);

  if ("sendBeacon" in navigator && typeof navigator.sendBeacon === "function") {
    const ok = navigator.sendBeacon(TELEMETRY_ENDPOINT, body);
    if (ok) return;
  }
  // Fallback: keepalive fetch (fire-and-forget, errors are non-fatal).
  try {
    await fetch(TELEMETRY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    /* telemetry is best-effort; never let it break the app */
  }
}

/**
 * Install global error capture (window 'error' + 'unhandledrejection') and
 * start the periodic flush. Call once at app startup (client-side).
 */
export function initObservability(): void {
  if (!isBrowser()) return;

  if (!flushTimer) {
    flushTimer = setInterval(() => {
      void flush();
    }, FLUSH_INTERVAL_MS);
    // Don't keep the event loop alive solely for telemetry.
    if (typeof flushTimer === "object" && "unref" in flushTimer) {
      (flushTimer as { unref: () => void }).unref();
    }
  }

  window.addEventListener("error", (e) => {
    logError("window_error", e.error ?? e.message, {
      message: e.message,
      filename: e.filename,
      lineno: e.lineno,
    });
  });

  window.addEventListener("unhandledrejection", (e) => {
    const reason = e.reason;
    logError("unhandled_rejection", reason, {
      message: reason instanceof Error ? reason.message : String(reason),
    });
  });

  window.addEventListener("beforeunload", () => {
    void flush();
  });
}
