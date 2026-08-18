import { describe, it, expect } from 'vitest';
import { parseManualEntry, findRepeatCandidate } from './parse-entry';
import type { ExpenseEntry } from '@/lib/types/budget';

const makeExpense = (over: Partial<ExpenseEntry>): ExpenseEntry => ({
  id: 'x',
  date: '2026-01-01',
  category: 'other',
  merchant: 'Starbucks',
  amount: 10,
  source: 'manual',
  ...over,
});

describe('parseManualEntry', () => {
  it('extracts leading amount and trailing note', () => {
    const r = parseManualEntry('120 lunch');
    expect(r).toEqual({ amount: 120, note: 'lunch' });
  });

  it('handles a note-first input with trailing amount', () => {
    const r = parseManualEntry('lunch 120');
    expect(r).toEqual({ amount: 120, note: 'lunch' });
  });

  it('returns amount 0 and the full text when no number is present', () => {
    const r = parseManualEntry('   just a note   ');
    expect(r).toEqual({ amount: 0, note: 'just a note' });
  });

  it('parses a decimal amount', () => {
    const r = parseManualEntry('45.50 coffee');
    expect(r).toEqual({ amount: 45.5, note: 'coffee' });
  });

  it('returns empty note for a bare amount', () => {
    const r = parseManualEntry('120');
    expect(r).toEqual({ amount: 120, note: '' });
  });
});

describe('findRepeatCandidate', () => {
  const expenses: ExpenseEntry[] = [
    makeExpense({ id: 'a', merchant: 'Starbucks', date: '2026-08-01' }),
    makeExpense({ id: 'b', merchant: 'STARBUCKS', date: '2026-08-10' }),
    makeExpense({ id: 'c', merchant: 'Woolworths', date: '2026-08-05' }),
  ];

  it('returns the most recent case-insensitive merchant match', () => {
    const c = findRepeatCandidate(expenses, 'starbucks');
    expect(c?.id).toBe('b');
  });

  it('returns undefined for an empty merchant', () => {
    expect(findRepeatCandidate(expenses, '')).toBeUndefined();
    expect(findRepeatCandidate(expenses, '   ')).toBeUndefined();
  });

  it('returns undefined for no match', () => {
    expect(findRepeatCandidate(expenses, 'KFC')).toBeUndefined();
  });

  it('tolerates an undefined expense list', () => {
    expect(findRepeatCandidate(undefined, 'starbucks')).toBeUndefined();
  });
});
