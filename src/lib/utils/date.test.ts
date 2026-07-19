// lib/utils/date.test.ts
import { describe, it, expect } from 'vitest';
import {
  getThaiHolidays,
  getThaiBuddhistEraYear,
  formatBuddhistEra,
  isHoliday,
  getHolidaysOn,
  toISODate,
} from './date';

describe('getThaiHolidays', () => {
  it('returns 2026 national holidays', () => {
    const h = getThaiHolidays(2026);
    expect(h.length).toBeGreaterThan(0);
    // Songkran is a multi-day national holiday in April 2026
    const names = h.map((x) => x.name);
    expect(names).toContain('Songkran');
    expect(names).toContain('Makha Bucha');
    expect(names).toContain('Visakha Bucha');
    // Every entry for a curated year is marked national
    expect(h.every((x) => x.national)).toBe(true);
  });

  it('returns 2027 national holidays including Buddhist observances', () => {
    const h = getThaiHolidays(2027);
    const names = h.map((x) => x.name);
    expect(names).toContain('Makha Bucha');
    expect(names).toContain('Visakha Bucha');
    expect(names).toContain('Asalha Bucha');
    expect(names).toContain('Khao Phansa');
  });

  it('returns an empty array for unsupported years', () => {
    expect(getThaiHolidays(2030)).toEqual([]);
  });
});

describe('getThaiBuddhistEraYear', () => {
  it('adds 543 to the Gregorian year', () => {
    expect(getThaiBuddhistEraYear(new Date(2026, 0, 1))).toBe(2569);
    expect(getThaiBuddhistEraYear(new Date(2027, 11, 31))).toBe(2570);
  });
});

describe('formatBuddhistEra', () => {
  it('formats the BE year as a string', () => {
    expect(formatBuddhistEra(new Date(2026, 0, 1))).toBe('2569');
    expect(formatBuddhistEra(new Date(2000, 5, 15))).toBe('2543');
  });
});

describe('isHoliday', () => {
  it('detects a known national holiday', () => {
    expect(isHoliday(new Date(2026, 0, 1))).toBe(true); // New Year's Day
    expect(isHoliday(new Date(2026, 3, 13))).toBe(true); // Songkran
    expect(isHoliday(new Date(2026, 3, 14))).toBe(true); // Songkran Holiday
  });

  it('returns false for a non-holiday date', () => {
    expect(isHoliday(new Date(2026, 0, 20))).toBe(false);
    expect(isHoliday(new Date(2026, 5, 15))).toBe(false);
  });

  it('correctly filters by year', () => {
    // The same month/day may be a holiday in one year and not the other.
    expect(isHoliday(new Date(2026, 1, 21))).toBe(false); // 2026-02-21 not a holiday
    expect(isHoliday(new Date(2027, 1, 21))).toBe(true); // 2027-02-21 Makha Bucha
  });
});

describe('getHolidaysOn', () => {
  it('returns the holiday(s) on a given date', () => {
    const on = getHolidaysOn(new Date(2026, 3, 13));
    expect(on.length).toBe(1);
    expect(on[0].name).toBe('Songkran');
  });

  it('returns [] when nothing falls on that date', () => {
    expect(getHolidaysOn(new Date(2026, 0, 20))).toEqual([]);
  });
});

describe('toISODate', () => {
  it('zero-pads month and day', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toISODate(new Date(2027, 11, 31))).toBe('2027-12-31');
  });
});
