import { describe, expect, test } from 'vitest';
import { parseAmounts } from './amounts';

describe('Currency-aware amount tokeniser', () => {
  test('parses standard amounts with dot decimal', () => {
    const amounts = parseAmounts('TOTAL 1234.56');
    expect(amounts).toHaveLength(1);
    expect(amounts[0].value).toBe(1234.56);
    expect(amounts[0].raw).toBe('1234.56');
  });

  test('parses amounts with ZAR currency symbol and space thousand separator', () => {
    const amounts = parseAmounts('R 1 234.56');
    expect(amounts).toHaveLength(1);
    expect(amounts[0].value).toBe(1234.56);
  });

  test('parses THB currency symbol with comma thousand separator', () => {
    const amounts = parseAmounts('฿1,234.56');
    expect(amounts).toHaveLength(1);
    expect(amounts[0].value).toBe(1234.56);
  });

  test('parses European format with comma decimal and dot thousands', () => {
    const amounts = parseAmounts('1.234,56');
    expect(amounts).toHaveLength(1);
    expect(amounts[0].value).toBe(1234.56);
    expect(amounts[0].decimalSep).toBe(',');
  });

  test('parses trailing negative amounts (e.g. discount or refund)', () => {
    const amounts = parseAmounts('DISCOUNT 105.00-');
    expect(amounts).toHaveLength(1);
    expect(amounts[0].value).toBe(-105.0);
  });

  test('rejects VAT numbers, phone numbers, and dates', () => {
    expect(parseAmounts('VAT REG NO 4123456789')).toHaveLength(0);
    expect(parseAmounts('TEL 0215551234')).toHaveLength(0);
    expect(parseAmounts('DATE 15/03/2026')).toHaveLength(0);
    expect(parseAmounts('TIME 14:30')).toHaveLength(0);
  });
});

// Guards regression for the shipped amounts.ts fix: the decimal alternatives in
// the match regex are anchored with `(?!\d)` and the conversion branches on
// `hasDecimalTail`. Before that fix a three-digit thousands group was read as a
// two-digit minor-unit tail — `28,000` matched the `28,00` prefix and became
// 28.00, a 1000x under-read on every currency that groups thousands but omits
// minor units (IDR, VND, CLP, JPY).
describe('Grouped-thousands amounts read at full value', () => {
  test('reads comma-grouped thousands as thousands, not as a decimal tail', () => {
    const amounts = parseAmounts('TOTAL 28,000');
    expect(amounts).toHaveLength(1);
    expect(amounts[0].value).toBe(28000);
    expect(amounts[0].raw).toBe('28,000');
  });

  test('reads dot-grouped thousands as thousands, not as a decimal tail', () => {
    const amounts = parseAmounts('TOTAL 60.000');
    expect(amounts).toHaveLength(1);
    expect(amounts[0].value).toBe(60000);
  });

  test('reads multi-group integers at full value', () => {
    const amounts = parseAmounts('1.234.567');
    expect(amounts).toHaveLength(1);
    expect(amounts[0].value).toBe(1234567);
  });

  test('still reads a two-digit tail after a thousands group as minor units', () => {
    const usFormat = parseAmounts('1,234.56');
    expect(usFormat).toHaveLength(1);
    expect(usFormat[0].value).toBe(1234.56);
    expect(usFormat[0].decimalSep).toBe('.');

    const euFormat = parseAmounts('1.234,56');
    expect(euFormat).toHaveLength(1);
    expect(euFormat[0].value).toBe(1234.56);
    expect(euFormat[0].decimalSep).toBe(',');
  });

  test('preserves trailing- and leading-minus negative handling', () => {
    const trailing = parseAmounts('DISCOUNT 105.00-');
    expect(trailing).toHaveLength(1);
    expect(trailing[0].value).toBe(-105.0);
    expect(trailing[0].isNegative).toBe(true);

    const groupedNegative = parseAmounts('TOTAL DISC -60.000');
    expect(groupedNegative).toHaveLength(1);
    expect(groupedNegative[0].value).toBe(-60000);
    expect(groupedNegative[0].isNegative).toBe(true);
  });

  test('leaves separator-less integers to the anchored callers', () => {
    // Bare integers stay out of the tokeniser on purpose: receipts are full of
    // counts, till numbers and item codes. `extract_total` opts in to reading
    // them only on a line that already matched a total anchor.
    expect(parseAmounts('TOTAL 91000')).toHaveLength(0);
    expect(parseAmounts('TOTAL ITEMS 3')).toHaveLength(0);
  });
});
