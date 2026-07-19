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
  it('is the union of known codes', () => {
    const codes: CurrencyCode[] = ['THB', 'USD'];
    expect(codes).toHaveLength(2);
  });
});
