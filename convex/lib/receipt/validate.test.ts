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

  // Guards regression: the digit-repair path re-read the repaired string with
  // `replace(/[^0-9\.]/g, '')`, which collapsed `6O.OOO` to 60 and `1.234,56`
  // to 1.234. The arithmetic confirmation could therefore never succeed on a
  // grouped-thousands or European-format receipt, so a genuinely repairable
  // total stayed low-confidence. The repaired string now goes through
  // parseAmounts, the single money tokeniser.
  test('confirms a repaired grouped-thousands total', () => {
    const repaired = validateExtraction({
      totalRaw: '6O.OOO',
      total: 60000,
      subtotal: 55000,
      tax: 5000,
      totalConf: 0.7,
    });

    expect(repaired.repairedDigits).toBe(true);
    expect(repaired.adjustedTotalConf).toBeGreaterThan(0.7);
  });

  test('confirms a repaired European-format total', () => {
    // The repair path only runs when totalRaw carries OCR-garbled glyphs, so
    // the trailing 8 arrives as a B. Under the old digit-strip the string
    // collapsed to 1.23458 and never matched subtotal + tax.
    const repaired = validateExtraction({
      totalRaw: '1.234,5B',
      total: 1234.58,
      subtotal: 1100.0,
      tax: 134.58,
      totalConf: 0.7,
    });

    expect(repaired.repairedDigits).toBe(true);
    expect(repaired.adjustedTotalConf).toBeGreaterThan(0.7);
  });
});
