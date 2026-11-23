import { describe, expect, it } from 'vitest';
import { convertReceiptAmount, FALLBACK_RATES } from './currency-options';

const ALL_CURRENCY_CODES = [
  'THB', 'JPY', 'CNY', 'HKD', 'TWD', 'KRW', 'SGD',
  'MYR', 'IDR', 'PHP', 'VND', 'INR', 'BDT', 'PKR',
  'LKR', 'NZD', 'AUD', 'EUR', 'GBP', 'CHF', 'NOK',
  'SEK', 'DKK', 'PLN', 'CZK', 'HUF', 'RUB', 'TRY',
  'UAH', 'USD', 'CAD', 'MXN', 'BRL', 'ARS', 'CLP',
  'COP', 'PEN', 'AED', 'SAR', 'ILS', 'ZAR', 'EGP',
  'NGN', 'KES', 'MAD',
] as const;

describe('FALLBACK_RATES', () => {
  it('has a positive fallback rate for every supported CurrencyCode, including THB', () => {
    for (const code of ALL_CURRENCY_CODES) {
      expect(FALLBACK_RATES[code], `missing fallback rate for ${code}`).toBeGreaterThan(0);
    }
  });
});

describe('convertReceiptAmount', () => {
  it('converts the scanned amount into the board currency using the shared fallback rates', () => {
    expect(convertReceiptAmount(200, 'EUR', 'USD')).toEqual({
      scannedCurrency: 'EUR',
      boardCurrency: 'USD',
      originalAmount: 200,
      convertedAmount: 217,
    });
  });

  it('returns null when either currency is missing or they are the same', () => {
    expect(convertReceiptAmount(100, '', 'USD')).toBeNull();
    expect(convertReceiptAmount(100, 'USD', null)).toBeNull();
    expect(convertReceiptAmount(100, 'USD', 'USD')).toBeNull();
  });
});
