// lib/utils/currency.test.ts
import {
  currencyFromLocation,
  formatMoney,
  formatCurrency,
  type CurrencyCode,
} from './currency';

describe('currencyFromLocation', () => {
  it('maps TH country to THB', () => {
    expect(currencyFromLocation('TH')).toBe('THB');
  });

  it('maps US country to USD', () => {
    expect(currencyFromLocation('US')).toBe('USD');
  });

  it('returns null for OTHER', () => {
    expect(currencyFromLocation('OTHER')).toBeNull();
  });

  it('returns null for missing/empty country', () => {
    expect(currencyFromLocation(null)).toBeNull();
    expect(currencyFromLocation(undefined as never)).toBeNull();
    expect(currencyFromLocation('')).toBeNull();
  });

  // ── Worldwide coverage (top budgeting apps auto-pick currency by region) ──
  it('maps Europe to EUR', () => {
    expect(currencyFromLocation('DE')).toBe('EUR');
    expect(currencyFromLocation('FR')).toBe('EUR');
    expect(currencyFromLocation('ES')).toBe('EUR');
  });

  it('maps United Kingdom to GBP', () => {
    expect(currencyFromLocation('GB')).toBe('GBP');
  });

  it('maps Japan to JPY', () => {
    expect(currencyFromLocation('JP')).toBe('JPY');
  });

  it('maps Singapore to SGD', () => {
    expect(currencyFromLocation('SG')).toBe('SGD');
  });

  it('maps Australia to AUD', () => {
    expect(currencyFromLocation('AU')).toBe('AUD');
  });

  it('maps Canada / Brazil / India to their currencies', () => {
    expect(currencyFromLocation('CA')).toBe('CAD');
    expect(currencyFromLocation('BR')).toBe('BRL');
    expect(currencyFromLocation('IN')).toBe('INR');
  });

  it('is case-insensitive and trims whitespace', () => {
    expect(currencyFromLocation(' gb ')).toBe('GBP');
    expect(currencyFromLocation('Jp')).toBe('JPY');
  });

  it('returns null for unsupported / no-currency codes', () => {
    expect(currencyFromLocation('AQ')).toBeNull(); // Antarctica
    expect(currencyFromLocation('XX')).toBeNull();
  });
});

describe('formatMoney', () => {
  it('formats THB with symbol under th locale', () => {
    expect(formatMoney(12500, 'THB', 'th')).toBe('฿12,500');
  });

  it('formats USD with symbol under en locale', () => {
    expect(formatMoney(12500, 'USD', 'en')).toBe('$12,500');
  });

  it('formats null currency as plain grouped numerals (no symbol)', () => {
    expect(formatMoney(12500, null, 'en')).toBe('12,500');
    expect(formatMoney(12500, null, 'th')).toBe('12,500');
  });

  it('formats negative amounts with symbol', () => {
    expect(formatMoney(-500, 'USD', 'en')).toBe('-$500');
  });
});

describe('formatCurrency (legacy locale helper)', () => {
  it('honors explicit currency param when provided', () => {
    expect(formatCurrency(100, 'th', 'THB')).toBe('฿100');
  });

  it('falls back to th->THB / en->USD when no currency given', () => {
    expect(formatCurrency(100, 'th')).toBe('฿100');
    expect(formatCurrency(100, 'en')).toBe('$100');
  });

  it('accepts a null currency for symbol-less numerals', () => {
    expect(formatCurrency(100, 'en', null)).toBe('100');
  });
});

describe('CurrencyCode type', () => {
  it('covers THB, USD and major world currencies', () => {
    const codes: CurrencyCode[] = ['THB', 'USD', 'GBP', 'EUR', 'JPY', 'SGD', 'AUD'];
    expect(codes).toHaveLength(7);
  });
});
