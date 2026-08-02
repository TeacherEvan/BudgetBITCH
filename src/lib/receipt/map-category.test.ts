import { describe, it, expect } from 'vitest';
import { mapCategory, reconcileLineItems } from './map-category';
import type { ExpenseCategory } from '@/lib/types/budget';

// Every member of the ExpenseCategory union. mapCategory must never return a
// value outside this set — the scanned-review <select> only renders these, so
// a stray backend value (shopping/medical/personal) would silently blank it.
const VALID_CATEGORIES: ExpenseCategory[] = [
  'housing',
  'transport',
  'food',
  'utilities',
  'phone_internet',
  'subscriptions',
  'entertainment',
  'healthcare',
  'insurance',
  'debt',
  'savings',
  'other',
];

describe('mapCategory', () => {
  it('maps grocery/food keywords to food', () => {
    expect(mapCategory('bread')).toBe('food');
    expect(mapCategory('milk 2L')).toBe('food');
    expect(mapCategory('grocery')).toBe('food');
    expect(mapCategory('Grocer')).toBe('food');
    expect(mapCategory('restaurant bill')).toBe('food');
  });

  it('maps travel keywords to transport', () => {
    expect(mapCategory('fuel')).toBe('transport');
    expect(mapCategory('Uber trip')).toBe('transport');
    expect(mapCategory('taxi')).toBe('transport');
  });

  it('maps medical keywords to healthcare', () => {
    expect(mapCategory('pharmacy')).toBe('healthcare');
    expect(mapCategory('medicine')).toBe('healthcare');
    expect(mapCategory('doctor visit')).toBe('healthcare');
  });

  it('maps leisure keywords to entertainment', () => {
    expect(mapCategory('movie ticket')).toBe('entertainment');
    expect(mapCategory('game')).toBe('entertainment');
  });

  it('falls back to other for unknown, empty, null and undefined input', () => {
    expect(mapCategory('zzzz unknown thing')).toBe('other');
    expect(mapCategory('')).toBe('other');
    expect(mapCategory(null)).toBe('other');
    expect(mapCategory(undefined)).toBe('other');
  });

  it('collapses backend-only categories into the ExpenseCategory union', () => {
    // shopping/personal/education have no ExpenseCategory member.
    expect(mapCategory('shopping')).toBe('other');
    expect(mapCategory('personal')).toBe('other');
    expect(mapCategory('education')).toBe('other');
    // medical is the backend spelling of healthcare.
    expect(mapCategory('medical')).toBe('healthcare');
  });

  it('never returns a value outside the ExpenseCategory union', () => {
    const samples = [
      'bread', 'fuel', 'pharmacy', 'movie', 'netflix', 'rent', 'electricity',
      'internet', 'insurance', 'loan', 'invest', 'shopping', '', 'σ unknown',
      '12345', 'TOTAL', 'VAT 15%',
    ];
    for (const sample of samples) {
      expect(VALID_CATEGORIES).toContain(mapCategory(sample));
    }
  });
});

describe('reconcileLineItems', () => {
  const items = [
    { description: 'bread', amount: 25.0 },
    { description: 'milk', amount: 18.5 },
    { description: 'movie rental', amount: 56.5 },
  ]; // sum = 100.00

  it('returns the items when the sum matches the total exactly', () => {
    expect(reconcileLineItems(items, 100)).toBe(items);
  });

  it('tolerates cent-level rounding drift', () => {
    expect(reconcileLineItems(items, 100.02)).toBe(items);
    expect(reconcileLineItems(items, 99.98)).toBe(items);
  });

  it('tolerates drift up to 1% on larger totals', () => {
    const big = [{ description: 'tv', amount: 9950 }];
    // 1% of 10000 = 100, so a 50 gap is inside tolerance.
    expect(reconcileLineItems(big, 10000)).toBe(big);
  });

  it('rejects an itemization that diverges from the total', () => {
    // Half-parsed receipt: OCR dropped a line.
    expect(reconcileLineItems(items, 250)).toBeUndefined();
    expect(reconcileLineItems(items, 60)).toBeUndefined();
  });

  it('rejects empty, null and undefined item sets', () => {
    expect(reconcileLineItems([], 100)).toBeUndefined();
    expect(reconcileLineItems(null, 100)).toBeUndefined();
    expect(reconcileLineItems(undefined, 100)).toBeUndefined();
  });

  it('rejects a non-positive or non-finite total', () => {
    expect(reconcileLineItems(items, 0)).toBeUndefined();
    expect(reconcileLineItems(items, -100)).toBeUndefined();
    expect(reconcileLineItems(items, Number.NaN)).toBeUndefined();
  });
});
