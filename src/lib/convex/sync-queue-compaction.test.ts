import { describe, it, expect } from 'vitest';
import {
  compactQueueByDate,
  compactQueueByDateDetailed,
  backoffWithJitter,
  type QueuedSnapshot,
} from './sync-queue-compaction';

// Anchor timestamps (UTC) for deterministic day-bucketing.
const day = (iso: string) => new Date(iso).getTime();
const A = day('2026-08-18T09:00:00Z');
const B = day('2026-08-18T15:00:00Z'); // same day as A, later
const C = day('2026-08-19T10:00:00Z');

describe('compactQueueByDate', () => {
  it('returns a single-item list unchanged', () => {
    const items: QueuedSnapshot[] = [{ id: 1, data: {}, timestamp: A }];
    expect(compactQueueByDate(items)).toEqual(items);
  });

  it('keeps the latest entry per calendar day', () => {
    const items: QueuedSnapshot[] = [
      { id: 1, data: { v: 'morning' }, timestamp: A },
      { id: 2, data: { v: 'afternoon' }, timestamp: B }, // same day, later
      { id: 3, data: { v: 'next-day' }, timestamp: C },
    ];
    const out = compactQueueByDate(items);
    expect(out).toHaveLength(2);
    expect(out.find((i) => i.id === 2)).toBeDefined(); // afternoon wins for 08-18
    expect(out.find((i) => i.id === 3)).toBeDefined();
    expect(out.find((i) => i.id === 1)).toBeUndefined();
  });

  it('preserves entries with no valid timestamp (treated as distinct)', () => {
    const items: QueuedSnapshot[] = [
      { id: 1, data: {}, timestamp: A },
      { id: 2, data: {}, timestamp: 0 },
      { id: 3, data: {}, timestamp: NaN },
    ];
    const out = compactQueueByDate(items);
    expect(out).toHaveLength(3); // 08-18 + invalid:0 + invalid:NaN
  });

  it('does not mutate the input array', () => {
    const items: QueuedSnapshot[] = [
      { id: 1, data: {}, timestamp: A },
      { id: 2, data: {}, timestamp: B },
    ];
    const snapshot = [...items];
    compactQueueByDate(items);
    expect(items).toEqual(snapshot);
  });
});

// P0-C2: the flush must know WHICH ids a winner superseded so it can delete
// all same-day rows in one transaction. The plain winners-only helper cannot
// express this — hence the detailed variant.
describe('compactQueueByDateDetailed (P0-C2)', () => {
  it('returns the winner plus every superseded id for each calendar day', () => {
    const items: QueuedSnapshot[] = [
      { id: 1, data: { v: 'morning' }, timestamp: A },
      { id: 2, data: { v: 'afternoon' }, timestamp: B },
      { id: 3, data: { v: 'next-day' }, timestamp: C },
    ];
    const out = compactQueueByDateDetailed(items);
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual({ winner: items[1], supersededIds: [1] });
    expect(out[1]).toEqual({ winner: items[2], supersededIds: [] });
  });

  it('reports ALL earlier same-day rows, not just the immediately previous one', () => {
    const items: QueuedSnapshot[] = [
      { id: 1, data: { v: 'a' }, timestamp: A - 1000 },
      { id: 2, data: { v: 'b' }, timestamp: A },
      { id: 3, data: { v: 'c' }, timestamp: B },
    ];
    const out = compactQueueByDateDetailed(items);
    expect(out).toHaveLength(1);
    expect(out[0].winner.id).toBe(3);
    expect(out[0].supersededIds.sort()).toEqual([1, 2]);
  });

  it('keeps invalid-timestamp entries as their own buckets (no lost ids)', () => {
    const items: QueuedSnapshot[] = [
      { id: 1, data: {}, timestamp: 0 },
      { id: 2, data: {}, timestamp: NaN },
    ];
    const out = compactQueueByDateDetailed(items);
    expect(out.map((d) => d.winner.id).sort()).toEqual([1, 2]);
    expect(out.every((d) => d.supersededIds.length === 0)).toBe(true);
  });

  it('stays the source of truth for compactQueueByDate', () => {
    const items: QueuedSnapshot[] = [
      { id: 1, data: {}, timestamp: A },
      { id: 2, data: {}, timestamp: B },
      { id: 3, data: {}, timestamp: C },
    ];
    expect(compactQueueByDate(items)).toEqual(compactQueueByDateDetailed(items).map((d) => d.winner));
  });
});

describe('backoffWithJitter', () => {
  it('never exceeds maxDelayMs', () => {
    for (let attempt = 0; attempt < 12; attempt++) {
      const d = backoffWithJitter(attempt, 500, 8000);
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThanOrEqual(8000);
    }
  });

  it('is bounded by the exponential value for a given attempt', () => {
    // attempt 0 -> base 500, jittered in [0,500]
    for (let i = 0; i < 50; i++) {
      const d = backoffWithJitter(0, 500, 8000);
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThanOrEqual(500);
    }
  });

  it('caps at maxDelayMs even for very high attempts', () => {
    const d = backoffWithJitter(20, 500, 8000);
    expect(d).toBeLessThanOrEqual(8000);
  });

  it('returns 0 for attempt 0 at base 0 (no negative)', () => {
    expect(backoffWithJitter(0, 0, 100)).toBe(0);
  });
});
