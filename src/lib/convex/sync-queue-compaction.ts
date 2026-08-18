// Sync-queue compaction + backoff helpers, extracted from
// src/lib/convex/sync-snapshots.ts during the Budget Boss offline-resilience
// hardening (2026-08-18). Kept framework-free so the dedup + backoff math is
// unit-testable without IndexedDB (see sync-queue-compaction.test.ts).

export interface QueuedSnapshot {
  id?: number;
  data: unknown;
  timestamp: number;
  failCount?: number;
}

/**
 * Compact a list of queued daily snapshots so that only the most recent entry
 * per calendar day survives. Rapid offline edits can enqueue many duplicate
 * snapshots for the same day; replaying all of them wastes writes and can
 * thrash the cloud, so we keep one (the latest) per `YYYY-MM-DD`.
 *
 * Entries with no valid timestamp are preserved (we can't bucket them) but
 * sorted to the end so they flush last.
 */
export function compactQueueByDate(items: QueuedSnapshot[]): QueuedSnapshot[] {
  if (items.length <= 1) return items;

  const dayKey = (ts: number): string => {
    if (!Number.isFinite(ts) || ts <= 0) return `invalid:${ts}`;
    return new Date(ts).toISOString().split('T')[0];
  };

  const byDay = new Map<string, QueuedSnapshot>();
  // Iterate in order; later entries (more recent) overwrite earlier ones.
  for (const item of items) {
    byDay.set(dayKey(item.timestamp), item);
  }
  return Array.from(byDay.values());
}

/**
 * Exponential backoff with full jitter for a retry attempt.
 * attempt is 0-based (0 => first retry). The base delay doubles each attempt
 * up to `maxDelayMs`, then we randomly spread within [0, currentDelay] so many
 * concurrent flushes don't all hammer the server on the same tick.
 */
export function backoffWithJitter(
  attempt: number,
  baseDelayMs = 500,
  maxDelayMs = 8000,
): number {
  const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** Math.max(0, attempt));
  return Math.floor(Math.random() * (exp + 1));
}
