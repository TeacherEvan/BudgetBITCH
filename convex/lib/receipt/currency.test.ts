import { describe, it, expect } from 'vitest';
import { detectCurrency, parseAmount, parseDate, inferCategory } from './currency';

describe('currency — multi-currency symbol table', () => {
  describe('detectCurrency', () => {
    it('detects USD from $ symbol', () => {
      expect(detectCurrency('TOTAL $45.20')).toEqual({ code: 'USD', symbol: '$' });
    });

    it('detects EUR from € symbol', () => {
      expect(detectCurrency('TOTAL €45.20')).toEqual({ code: 'EUR', symbol: '€' });
    });

    it('detects GBP from £ symbol', () => {
      expect(detectCurrency('TOTAL £45.20')).toEqual({ code: 'GBP', symbol: '£' });
    });

    it('detects ZAR from R symbol', () => {
      expect(detectCurrency('TOTAL R 45.20')).toEqual({ code: 'ZAR', symbol: 'R' });
      expect(detectCurrency('TOTAL ZAR 45.20')).toEqual({ code: 'ZAR', symbol: 'R' });
    });

    it('detects JPY from ¥ symbol', () => {
      expect(detectCurrency('TOTAL ¥4520')).toEqual({ code: 'JPY', symbol: '¥' });
      expect(detectCurrency('TOTAL JPY 4520')).toEqual({ code: 'JPY', symbol: '¥' });
    });

    it('detects INR from ₹ symbol', () => {
      expect(detectCurrency('TOTAL ₹45.20')).toEqual({ code: 'INR', symbol: '₹' });
    });

    it('detects PHP from ₱ symbol', () => {
      expect(detectCurrency('TOTAL ₱45.20')).toEqual({ code: 'PHP', symbol: '₱' });
    });

    it('detects KRW from ₩ symbol', () => {
      expect(detectCurrency('TOTAL ₩4520')).toEqual({ code: 'KRW', symbol: '₩' });
    });

    it('detects CHF from CHF', () => {
      expect(detectCurrency('TOTAL CHF 45.20')).toEqual({ code: 'CHF', symbol: 'CHF' });
    });

    it('detects AUD from A$', () => {
      expect(detectCurrency('TOTAL A$45.20')).toEqual({ code: 'AUD', symbol: 'A$' });
    });

    it('detects CAD from C$', () => {
      expect(detectCurrency('TOTAL C$45.20')).toEqual({ code: 'CAD', symbol: 'C$' });
    });

    it('detects NZD from NZ$', () => {
      expect(detectCurrency('TOTAL NZ$45.20')).toEqual({ code: 'NZD', symbol: 'NZ$' });
    });

    it('detects SGD from SG$', () => {
      expect(detectCurrency('TOTAL SG$45.20')).toEqual({ code: 'SGD', symbol: 'SG$' });
    });

    it('detects HKD from HK$', () => {
      expect(detectCurrency('TOTAL HK$45.20')).toEqual({ code: 'HKD', symbol: 'HK$' });
    });

    it('defaults to USD when no currency found', () => {
      expect(detectCurrency('TOTAL 45.20')).toEqual({ code: 'USD', symbol: '$' });
      expect(detectCurrency('random text')).toEqual({ code: 'USD', symbol: '$' });
    });

    it('prefers first match in order', () => {
      // A$ should match before $
      expect(detectCurrency('TOTAL A$45.20')).toEqual({ code: 'AUD', symbol: 'A$' });
    });
  });

  describe('parseAmount', () => {
    it('parses decimal amounts', () => {
      expect(parseAmount('$45.20')).toBe(45.20);
      expect(parseAmount('1,234.50')).toBe(1234.50);
      expect(parseAmount('120.00')).toBe(120.00);
    });

    it('handles comma as decimal separator', () => {
      // This is the European format fallback
      expect(parseAmount('45,20')).toBe(45.20);
    });

    it('returns 0 for empty or invalid', () => {
      expect(parseAmount('')).toBe(0.0);
      expect(parseAmount('no numbers')).toBe(0.0);
    });

    // Guards regression: parseAmount kept its own three local regexes, the last
    // of which was a loose `\b\d+[.,]?\d*\b`. `Rp 28,000` fell through to it and
    // returned 28.00 — the same 1000x under-read fixed in amounts.ts, wearing a
    // different hat. parseAmount now delegates to parseAmounts so the grouping
    // rules live in exactly one place.
    it('keeps the magnitude of grouped thousands', () => {
      expect(parseAmount('Rp 28,000')).toBe(28000);
      expect(parseAmount('TOTAL 60.000')).toBe(60000);
      expect(parseAmount('1.234.567')).toBe(1234567);
    });

    it('reads European dot-thousands with a comma decimal tail', () => {
      // The old dot-regex matched the `1.234` prefix and returned 234.56.
      expect(parseAmount('1.234,56')).toBe(1234.56);
    });

    it('reads a separator-less integer amount', () => {
      expect(parseAmount('TOTAL 91000')).toBe(91000);
    });
  });

  describe('parseDate', () => {
    it('parses ISO YYYY-MM-DD', () => {
      expect(parseDate('2026-08-01', 'USD')).toBe('2026-08-01');
    });

    it('parses DD/MM/YYYY when day > 12', () => {
      expect(parseDate('15/08/2026', 'EUR')).toBe('2026-08-15');
    });

    it('parses MM/DD/YYYY for USD when ambiguous', () => {
      expect(parseDate('08/15/2026', 'USD')).toBe('2026-08-15');
    });

    it('parses DD/MM/YYYY for non-USD when ambiguous', () => {
      // 08/15/2026 - g2=15 > 12 means g2 is day, so MM/DD/YYYY → Aug 15
      expect(parseDate('08/15/2026', 'EUR')).toBe('2026-08-15');
    });

    it('parses DD-Mon-YYYY', () => {
      expect(parseDate('01-Aug-2026', 'USD')).toBe('2026-08-01');
    });

    it('returns null for invalid', () => {
      expect(parseDate('', 'USD')).toBeNull();
      expect(parseDate('not a date', 'USD')).toBeNull();
    });
  });

  describe('inferCategory', () => {
    it('maps food keywords (Budget Boss: food)', () => {
      expect(inferCategory('TESCO', 'MILK BREAD')).toBe('food');
      expect(inferCategory('WALMART', 'FOOD')).toBe('food');
    });

    it('maps dining keywords (Budget Boss: food)', () => {
      expect(inferCategory('STARBUCKS', 'COFFEE')).toBe('food');
      expect(inferCategory('MCDONALDS', 'BURGER')).toBe('food');
    });

    it('maps transport keywords (Budget Boss: transport)', () => {
      expect(inferCategory('UBER', 'RIDE')).toBe('transport');
      expect(inferCategory('SHELL', 'FUEL')).toBe('transport');
    });

    it('maps utilities keywords (Budget Boss: utilities)', () => {
      expect(inferCategory('VERIZON', 'INTERNET')).toBe('utilities');
    });

    it('maps shopping keywords (Budget Boss: shopping)', () => {
      expect(inferCategory('STAPLES', 'PAPER')).toBe('shopping');
    });

    it('defaults to other', () => {
      expect(inferCategory('UNKNOWN', 'RANDOM')).toBe('other');
    });
  });
});