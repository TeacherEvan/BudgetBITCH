import { describe, expect, test } from 'vitest';
import { validateExtraction } from './validate';

describe('Arithmetic cross-validation and digit repair', () => {
  test('validates subtotal + tax ≈ total and boosts confidence', () => {
    const result = validateExtraction({
      total: 53.98,
      subtotal: 46.94,
      tax: 7.04,
      itemsSum: 53.98,
      country: 'ZA',
      totalConf: 0.85,
    });

    expect(result.isValidSubtotalTax).toBe(true);
    expect(result.isValidVatRate).toBe(true);
    expect(result.adjustedTotalConf).toBeGreaterThanOrEqual(0.95);
  });

  test('repairs garbled digits (1O5.OO -> 105.00) when arithmetic check passes', () => {
    const repaired = validateExtraction({
      totalRaw: '1O5.OO',
      total: 105.0,
      subtotal: 100.0,
      tax: 5.0,
      totalConf: 0.7,
    });

    expect(repaired.repairedDigits).toBe(true);
    expect(repaired.adjustedTotalConf).toBeGreaterThan(0.7);
  });

  test('penalises total confidence if total is smaller than subtotal', () => {
    const result = validateExtraction({
      total: 20.0,
      subtotal: 50.0,
      totalConf: 0.8,
    });

    expect(result.adjustedTotalConf).toBeLessThan(0.6);
  });
});
