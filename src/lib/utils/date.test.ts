// lib/utils/date.test.ts
import { describe, it, expect } from 'vitest';
import { toISODate, formatLocalCalendarDate, getDaysUntilDue } from './date';

describe('toISODate', () => {
  it('formats local dates as YYYY-MM-DD', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toISODate(new Date(2027, 11, 31))).toBe('2027-12-31');
  });

  it('zero-pads single-digit months and days', () => {
    expect(toISODate(new Date(2026, 8, 9))).toBe('2026-09-09');
  });
});

describe('formatLocalCalendarDate', () => {
  it('parses YYYY-MM-DD in local time without UTC-midnight day shift', () => {
    const formatted = formatLocalCalendarDate('2026-08-15', 'en-US');
    expect(formatted).toContain('15');
    expect(formatted).toContain('2026');
  });

  it('returns the raw string gracefully when given an unparseable value', () => {
    expect(formatLocalCalendarDate('not-a-date', 'en-US')).toBe('not-a-date');
    expect(formatLocalCalendarDate('', 'en-US')).toBe('');
  });
});

describe('getDaysUntilDue', () => {
  it('rolls over cleanly from December to January of the next year', () => {
    // Dec 31, 2026 -> a bill due on the 15th is next due Jan 15, 2027 (15 days away)
    expect(getDaysUntilDue(15, new Date(2026, 11, 31))).toBe(15);
  });

  it('clamps dueDay=31 to 28 in a non-leap February and 29 in a leap February', () => {
    // Feb 1, 2026 (non-leap, 28 days) -> due Feb 28 (27 days)
    expect(getDaysUntilDue(31, new Date(2026, 1, 1))).toBe(27);
    // Feb 1, 2028 (leap year, 29 days) -> due Feb 29 (28 days)
    expect(getDaysUntilDue(31, new Date(2028, 1, 1))).toBe(28);
  });

  it('clamps next-month dueDay=31 to 28 when rolling over from Jan 31 into February', () => {
    // Jan 31, 2026 -> bill due on 30th has passed; next due is Feb 28, 2026 (28 days away)
    expect(getDaysUntilDue(30, new Date(2026, 0, 31))).toBe(28);
  });
});
