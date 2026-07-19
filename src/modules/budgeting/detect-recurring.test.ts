import { describe, expect, it } from 'vitest';
import {
  detectRecurringSubscriptions,
  groupByMerchant,
  classifyCadence,
  type DetectedSubscription,
} from './detect-recurring';
import type { ExpenseEntry } from '@/lib/types/budget';

function expense(over: Partial<ExpenseEntry>): ExpenseEntry {
  return {
    id: Math.random().toString(36).slice(2),
    date: '2026-01-01',
    category: 'other',
    merchant: 'X',
    amount: 100,
    source: 'manual',
    ...over,
  } as ExpenseEntry;
}

describe('groupByMerchant', () => {
  it('groups expenses by normalized merchant name', () => {
    const items = [
      expense({ merchant: 'Netflix', amount: 429 }),
      expense({ merchant: 'netflix', amount: 429 }),
      expense({ merchant: 'Spotify', amount: 199 }),
    ];
    const groups = groupByMerchant(items);
    expect(groups.size).toBe(2);
    expect(groups.get('netflix')!.length).toBe(2);
  });

  it('ignores already-recurring manual subscriptions', () => {
    const items = [
      expense({ merchant: 'Netflix', isRecurring: true }),
      expense({ merchant: 'Netflix', isRecurring: true }),
    ];
    const groups = groupByMerchant(items);
    expect(groups.has('netflix')).toBe(false);
  });
});

describe('classifyCadence', () => {
  it('detects monthly when gaps are ~28-31 days', () => {
    const dates = ['2026-01-05', '2026-02-04', '2026-03-06'].map((d) => new Date(d));
    expect(classifyCadence(dates)).toBe('monthly');
  });

  it('detects yearly when gaps are ~365 days', () => {
    const dates = ['2024-03-01', '2025-03-02', '2026-03-01'].map((d) => new Date(d));
    expect(classifyCadence(dates)).toBe('yearly');
  });

  it('returns null when fewer than 2 occurrences', () => {
    expect(classifyCadence([new Date('2026-01-01')])).toBeNull();
  });

  it('returns null when gaps are irregular', () => {
    const dates = ['2026-01-01', '2026-01-20', '2026-02-15'].map((d) => new Date(d));
    expect(classifyCadence(dates)).toBeNull();
  });
});

describe('detectRecurringSubscriptions', () => {
  it('flags a merchant with 3+ similar monthly charges as a subscription', () => {
    const items = [
      expense({ merchant: 'Netflix', amount: 429, date: '2026-01-05' }),
      expense({ merchant: 'Netflix', amount: 429, date: '2026-02-04' }),
      expense({ merchant: 'Netflix', amount: 429, date: '2026-03-06' }),
    ];
    const result = detectRecurringSubscriptions(items);
    expect(result).toHaveLength(1);
    const sub = result[0];
    expect(sub.merchant.toLowerCase()).toBe('netflix');
    expect(sub.cycle).toBe('monthly');
    expect(sub.typicalAmount).toBe(429);
    expect(sub.occurrences).toBe(3);
  });

  it('requires a minimum of 2 occurrences (configurable)', () => {
    const items = [
      expense({ merchant: 'Gym', amount: 800, date: '2026-01-10' }),
      expense({ merchant: 'Gym', amount: 800, date: '2026-02-09' }),
    ];
    expect(detectRecurringSubscriptions(items, 2)).toHaveLength(1);
    expect(detectRecurringSubscriptions(items, 3)).toHaveLength(0);
  });

  it('tolerates small amount variance (±15%) as same subscription', () => {
    const items = [
      expense({ merchant: 'Spotify', amount: 199, date: '2026-01-01' }),
      expense({ merchant: 'Spotify', amount: 205, date: '2026-02-01' }),
      expense({ merchant: 'Spotify', amount: 199, date: '2026-03-01' }),
    ];
    const result = detectRecurringSubscriptions(items);
    expect(result).toHaveLength(1);
    expect(result[0].typicalAmount).toBeGreaterThanOrEqual(199);
    expect(result[0].typicalAmount).toBeLessThanOrEqual(205);
  });

  it('ignores one-off purchases at the same merchant', () => {
    const items = [
      expense({ merchant: 'Lotus', amount: 1200, date: '2026-01-03' }),
      expense({ merchant: 'Lotus', amount: 350, date: '2026-01-25' }),
    ];
    expect(detectRecurringSubscriptions(items)).toHaveLength(0);
  });

  it('ignores already-recurring manual subscriptions', () => {
    const items = [
      expense({ merchant: 'Netflix', amount: 429, date: '2026-01-05', isRecurring: true }),
      expense({ merchant: 'Netflix', amount: 429, date: '2026-02-04', isRecurring: true }),
      expense({ merchant: 'Netflix', amount: 429, date: '2026-03-06', isRecurring: true }),
    ];
    expect(detectRecurringSubscriptions(items)).toHaveLength(0);
  });

  it('returns an empty array when there are no expenses', () => {
    expect(detectRecurringSubscriptions([])).toEqual([]);
  });

  it('produces DetectedSubscription objects shaped for one-click add', () => {
    const items = [
      expense({ merchant: 'Disney+', amount: 399, date: '2026-01-15' }),
      expense({ merchant: 'Disney+', amount: 399, date: '2026-02-14' }),
      expense({ merchant: 'Disney+', amount: 399, date: '2026-03-15' }),
    ];
    const [sub] = detectRecurringSubscriptions(items);
    const shape: DetectedSubscription = sub;
    expect(shape.merchant).toBe('Disney+');
    expect(shape.cycle).toBe('monthly');
    expect(typeof shape.typicalAmount).toBe('number');
    expect(Array.isArray(shape.evidence)).toBe(true);
  });
});
