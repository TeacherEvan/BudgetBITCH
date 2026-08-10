// Shared observability types for Budget Boss.
//
// Telemetry is structured: every emit is a JSON object with a stable `event`
// name and machine-readable `fields`. This file defines the wire shapes used
// by the client logger (src/lib/observability/logger.ts) and the
// /api/telemetry sink. Convex mirrors these shapes in convex/lib/log.ts.

export type LogLevel = "debug" | "info" | "warn" | "error";

/** A single structured log line. Stable `event` + arbitrary `fields`. */
export interface LogEvent {
  /** ISO-8601 timestamp. */
  ts: string;
  level: LogLevel;
  /** Stable, snake_case event name, e.g. "sync_snapshot_succeeded". */
  event: string;
  /** Constant service identifier so logs from web vs convex are filterable. */
  service: string;
  /** Stable per-page-load id; lets you follow one browser session. */
  sessionId: string;
  /** Correlation id for a single operation (sync run, ingest, etc.). */
  traceId?: string;
  /** All other structured fields. MUST NOT contain secrets or raw PII. */
  [field: string]: unknown;
}

/** A named metric sample (RED-style). Dimensions are small/fixed sets only. */
export interface MetricEvent {
  ts: string;
  service: string;
  sessionId: string;
  traceId?: string;
  /** Metric name, snake_case, e.g. "sync_duration_ms". */
  metric: string;
  value: number;
  unit: "ms" | "count" | "ratio" | "bytes";
  /** Bounded label set (route template, status class, provider). No ids/URLs. */
  tags?: Record<string, string>;
}

/** Batch envelope posted to /api/telemetry. */
export interface TelemetryBatch {
  logs?: LogEvent[];
  metrics?: MetricEvent[];
}
