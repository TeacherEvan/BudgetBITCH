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
