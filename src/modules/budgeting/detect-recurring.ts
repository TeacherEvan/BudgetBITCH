// modules/budgeting/detect-recurring.ts
//
// Local, privacy-first recurring-subscription detection.
// Scans the user's own expense history (e.g. from a CSV import or manual
// entries) and surfaces merchants that look like subscriptions — no external
// services, no network, no paid bill-negotiation integrations.

import type { ExpenseEntry } from '@/lib/types/budget';

export type Cadence = 'monthly' | 'yearly' | null;

export interface DetectedSubscription {
  merchant: string;
  cycle: Exclude<Cadence, null>;
  typicalAmount: number;
  occurrences: number;
  /** The underlying expense rows that supported the detection. */
  evidence: ExpenseEntry[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Average absolute day-gap between consecutive sorted dates. */
function averageGapDays(dates: Date[]): number {
  if (dates.length < 2) return 0;
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  let total = 0;
  for (let i = 1; i < sorted.length; i++) {
    total += (sorted[i].getTime() - sorted[i - 1].getTime()) / DAY_MS;
  }
  return total / (sorted.length - 1);
}

/**
 * Classifies a list of dates into a billing cadence.
 * - monthly: mean gap in [25, 35] days
 * - yearly:  mean gap in [350, 380] days
 * - null:    too few/single date, or irregular gaps
 */
export function classifyCadence(dates: Date[]): Cadence {
  if (dates.length < 2) return null;
  const gap = averageGapDays(dates);
  if (gap >= 25 && gap <= 35) return 'monthly';
  if (gap >= 350 && gap <= 380) return 'yearly';
  return null;
}

const normalizeMerchant = (m: string) =>
  m.trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Groups non-recurring expenses by normalized merchant name.
 * Already-recurring manual subscriptions are excluded so we don't
 * re-detect things the user already tracks.
 */
export function groupByMerchant(expenses: ExpenseEntry[]): Map<string, ExpenseEntry[]> {
  const map = new Map<string, ExpenseEntry[]>();
  for (const e of expenses) {
    if (e.isRecurring) continue; // already a tracked subscription
    if (!e.merchant || e.amount <= 0) continue;
    const key = normalizeMerchant(e.merchant);
    if (!key) continue;
    const list = map.get(key) ?? [];
    list.push(e);
    map.set(key, list);
  }
  return map;
}

/** Two amounts are "similar" if within ±15% of each other. */
function amountsSimilar(a: number, b: number): boolean {
  if (a <= 0 || b <= 0) return false;
  const diff = Math.abs(a - b) / ((a + b) / 2);
  return diff <= 0.15;
}

/**
 * Detects recurring subscriptions from expense history.
 * A merchant qualifies when it has at least `minOccurrences` (default 3)
 * non-recurring charges with similar amounts and a regular monthly/yearly
 * cadence.
 *
 * @param expenses  Full expense list (will be filtered internally).
 * @param minOccurrences Minimum similar charges required (default 3).
 */
export function detectRecurringSubscriptions(
  expenses: ExpenseEntry[],
  minOccurrences = 3,
): DetectedSubscription[] {
  if (!expenses || expenses.length === 0) return [];

  const groups = groupByMerchant(expenses);
  const detected: DetectedSubscription[] = [];

  for (const [, items] of groups.entries()) {
    if (items.length < minOccurrences) continue;

    // Find the largest cluster of similar-amount charges.
    const sorted = [...items].sort((a, b) => b.amount - a.amount);
    const clusters: ExpenseEntry[][] = [];
    for (const item of sorted) {
      const cluster = clusters.find((c) => amountsSimilar(c[0].amount, item.amount));
      if (cluster) cluster.push(item);
      else clusters.push([item]);
    }
    clusters.sort((a, b) => b.length - a.length);
    const best = clusters[0];

    if (best.length < minOccurrences) continue;

    const dates = best.map((e) => new Date(e.date)).filter((d) => !Number.isNaN(d.getTime()));
    const cadence = classifyCadence(dates);
    if (!cadence) continue; // irregular → not a subscription

    const typicalAmount =
      best.reduce((sum, e) => sum + e.amount, 0) / best.length;

    detected.push({
      merchant: best[0].merchant,
      cycle: cadence,
      typicalAmount: Math.round(typicalAmount * 100) / 100,
      occurrences: best.length,
      evidence: best.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    });
  }

  // Most frequent / highest-value first.
  detected.sort((a, b) => b.occurrences - a.occurrences || b.typicalAmount - a.typicalAmount);
  return detected;
}
