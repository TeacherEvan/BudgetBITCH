import { describe, expect, test } from 'vitest';
import { extractDate } from './dates';

describe('Date extractor', () => {
  const currentYear = 2026;
  const mockNow = new Date('2026-03-31T00:00:00Z').getTime();

  test('extracts DMY date (e.g. ZA/TH locale)', () => {
    const res = extractDate('DATE 15/03/2026 TIME 14:30', { countryHint: 'ZA', now: mockNow });
    expect(res).toBeDefined();
    expect(res?.date).toBe('2026-03-15');
    expect(res?.isAmbiguous).toBe(false);
  });

  test('extracts YMD date (ISO format)', () => {
    const res = extractDate('DATE: 2026-03-22', { now: mockNow });
    expect(res).toBeDefined();
    expect(res?.date).toBe('2026-03-22');
  });

  test('extracts text month format (15 MAR 2026)', () => {
    const res = extractDate('TAX INVOICE 15 MAR 2026', { now: mockNow });
    expect(res).toBeDefined();
    expect(res?.date).toBe('2026-03-15');
  });

  test('converts Thai Buddhist-era year 2568 to Gregorian 2025', () => {
    const res = extractDate('10/05/2568', { countryHint: 'TH', now: mockNow });
    expect(res).toBeDefined();
    expect(res?.date).toBe('2025-05-10');
  });

  test('flags ambiguous DD/MM/YY when country hint is absent', () => {
    const res = extractDate('03/04/25', { now: mockNow });
    expect(res).toBeDefined();
    expect(res?.isAmbiguous).toBe(true);
  });

  test('rejects future dates (beyond now)', () => {
    const res = extractDate('DATE 15/08/2030', { now: mockNow });
    expect(res).toBeNull();
  });

  test('rejects dates older than 2 years', () => {
    const res = extractDate('DATE 15/03/2020', { now: mockNow });
    expect(res).toBeNull();
  });
});
