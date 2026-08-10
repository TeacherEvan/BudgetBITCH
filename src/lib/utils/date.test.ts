// lib/utils/date.test.ts
import { describe, it, expect } from 'vitest';
import { toISODate } from './date';

describe('toISODate', () => {
  it('formats local dates as YYYY-MM-DD', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toISODate(new Date(2027, 11, 31))).toBe('2027-12-31');
  });

  it('zero-pads single-digit months and days', () => {
    expect(toISODate(new Date(2026, 8, 9))).toBe('2026-09-09');
  });
});
