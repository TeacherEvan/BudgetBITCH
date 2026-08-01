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