import { describe, it, expect } from 'vitest';
import {
  parseSMS,
  detectCountry,
  normalizeAmount,
  normalizeDate,
  extractMerchant,
  detectType,
  looksLikeBankSMS,
  getBestCandidate,
  filterByConfidence,
  parseSMSArray,
} from './index';
import type { TransactionCandidate, ParsedSMSResult } from './types';

describe('detectCountry', () => {
  it('detects Thailand from baht symbol and bank names', () => {
    expect(detectCountry('SCB แจ้งยอดฝาก 1,000.00 บาท จาก 123456')).toBe('TH');
    expect(detectCountry('KPLUS แจ้งยอดโอน 500.00 บาท')).toBe('TH');
    expect(detectCountry('BBL แจ้งยอดจ่าย 1,200.00 บาท')).toBe('TH');
    expect(detectCountry('KTB แจ้งยอดซื้อ 350.00 บาท')).toBe('TH');
    expect(detectCountry('1,500.00 บาท ที่ LOTUS')).toBe('TH');
  });

  it('detects US from $ and bank names', () => {
    expect(detectCountry('CHASE: Your card ending in 1234 was charged $45.67 at STARBUCKS')).toBe('US');
    expect(detectCountry('Bank of America Alert: $123.45 purchase at TARGET')).toBe('US');
    expect(detectCountry('Wells Fargo: $56.78 purchase at WALMART')).toBe('US');
    expect(detectCountry('Citi Card ending 1234: $78.90 at AMAZON')).toBe('US');
  });

  it('detects SG from SGD and bank names', () => {
    expect(detectCountry('DBS Alert: SGD 45.67 spent at GRAB')).toBe('SG');
    expect(detectCountry('UOB Card ending 1234: SGD 67.89 at COLD STORAGE')).toBe('SG');
  });

  it('detects EU from EUR and fintech names', () => {
    expect(detectCountry('Revolut: You spent EUR 45.67 at STARBUCKS')).toBe('EU');
    expect(detectCountry('N26: You paid EUR 23.45 to REWE')).toBe('EU');
    expect(detectCountry('Wise: You sent EUR 100.00 to John Smith')).toBe('EU');
  });

  it('detects other countries', () => {
    expect(detectCountry('Monzo: You spent £45.67 at TESCO')).toBe('GB');
    expect(detectCountry('CommBank: $123.45 purchase at WOOLWORTHS')).toBe('AU');
    expect(detectCountry('RBC: $56.78 purchase at TIM HORTONS')).toBe('CA');
    expect(detectCountry('PayPay: ¥1,234 at FAMILYMART')).toBe('JP');
    expect(detectCountry('微信支付: ¥88.00 支付给 美团')).toBe('CN');
  });

  it('returns generic for unknown text', () => {
    expect(detectCountry('Hello world')).toBe('generic');
    expect(detectCountry('Random text without amounts')).toBe('generic');
    expect(detectCountry('')).toBe('generic');
  });
});

describe('normalizeAmount', () => {
  it('parses simple amounts', () => {
    expect(normalizeAmount('45.67')).toBe(45.67);
    expect(normalizeAmount('1,234.56')).toBe(1234.56);
    expect(normalizeAmount('1000')).toBe(1000);
  });

  it('handles currency symbols', () => {
    expect(normalizeAmount('$45.67')).toBe(45.67);
    expect(normalizeAmount('€1,234.56')).toBe(1234.56);
    expect(normalizeAmount('£100')).toBe(100);
    expect(normalizeAmount('¥5000')).toBe(5000);
    expect(normalizeAmount('₹1,234.56')).toBe(1234.56);
    expect(normalizeAmount('฿1,000.00')).toBe(1000);
  });

  it('handles comma as decimal separator', () => {
    expect(normalizeAmount('45,67')).toBe(45.67);
    expect(normalizeAmount('1.234,56')).toBe(1234.56);
  });

  it('handles parentheses as negative (returns magnitude)', () => {
    expect(normalizeAmount('(45.67)')).toBe(45.67);
  });

  it('returns null for invalid', () => {
    expect(normalizeAmount('abc')).toBeNull();
    expect(normalizeAmount('')).toBeNull();
    expect(normalizeAmount(null as unknown as string)).toBeNull();
  });
});

describe('normalizeDate', () => {
  it('parses ISO dates', () => {
    expect(normalizeDate('2026-01-15')).toBe('2026-01-15');
    expect(normalizeDate('2026/01/15')).toBe('2026-01-15');
    expect(normalizeDate('2026.01.15')).toBe('2026-01-15');
  });

  it('parses dd/mm/yyyy', () => {
    expect(normalizeDate('15/01/2026')).toBe('2026-01-15');
    expect(normalizeDate('15.01.2026')).toBe('2026-01-15');
  });

  it('parses mm/dd/yyyy (US)', () => {
    expect(normalizeDate('01/15/2026')).toBe('2026-01-15');
    expect(normalizeDate('12/31/2025')).toBe('2025-12-31');
  });

  it('parses dd/mm/yy', () => {
    expect(normalizeDate('15/01/26')).toBe('2026-01-15');
  });

  it('returns null for invalid', () => {
    expect(normalizeDate('not a date')).toBeNull();
    expect(normalizeDate('')).toBeNull();
    expect(normalizeDate('32/01/2026')).toBeNull();
  });
});

describe('extractMerchant', () => {
  it('extracts merchant from text with amount', () => {
    expect(extractMerchant('Spent $45.67 at STARBUCKS', '$45.67')).toBe('STARBUCKS');
    expect(extractMerchant('Purchase $123.45 AMAZON.COM', '$123.45')).toBe('AMAZON.COM');
    expect(extractMerchant('CHASE: $78.90 at TARGET on 01/15', '$78.90')).toBe('TARGET');
  });

  it('handles missing amount', () => {
    expect(extractMerchant('Random text', '999')).toBe('Random text');
  });
});

describe('detectType', () => {
  it('detects expense', () => {
    expect(detectType('Spent $45.67 at STARBUCKS')).toBe('expense');
    expect(detectType('Purchase $100 at AMAZON')).toBe('expense');
  });

  it('detects income', () => {
    expect(detectType('Salary credited $3000')).toBe('income');
    expect(detectType('Deposit $500 received')).toBe('income');
    expect(detectType('Top up $100')).toBe('income');
  });

  it('detects refund', () => {
    expect(detectType('Refund of $25.00 from STORE')).toBe('refund');
    expect(detectType('Reversal $15.00')).toBe('refund');
  });

  it('detects transfer', () => {
    expect(detectType('Transfer to JOHN $100')).toBe('transfer');
    expect(detectType('Sent $50 to Jane')).toBe('transfer');
  });

  it('detects ATM', () => {
    expect(detectType('ATM withdrawal $200')).toBe('atm');
    expect(detectType('Cash withdrawal $150')).toBe('atm');
  });

  it('detects fee', () => {
    expect(detectType('Service fee $5.00')).toBe('fee');
    expect(detectType('Annual fee $50')).toBe('fee');
  });
});

describe('looksLikeBankSMS', () => {
  it('returns true for bank-like SMS', () => {
    expect(looksLikeBankSMS('CHASE: $45.67 at STARBUCKS')).toBe(true);
    expect(looksLikeBankSMS('You spent $23.45 at TARGET')).toBe(true);
    expect(looksLikeBankSMS('SCB แจ้งยอดฝาก 1,000 บาท')).toBe(true);
    expect(looksLikeBankSMS('Transfer to John $100')).toBe(true);
  });

  it('returns false for non-bank SMS', () => {
    expect(looksLikeBankSMS('Hey, how are you?')).toBe(false);
    expect(looksLikeBankSMS('Meeting at 3pm')).toBe(false);
    expect(looksLikeBankSMS('')).toBe(false);
  });
});

describe('parseSMS', () => {
  it('parses Thai SCB SMS', () => {
    const text = 'SCB แจ้งยอดฝาก 1,000.00 บาท จาก 123456 30/01/2567 10:30';
    const result = parseSMS(text, 'share-target');
    expect(result.candidates.length).toBeGreaterThan(0);
    const c = result.candidates[0];
    expect(c.amount).toBe(1000);
    expect(c.currency).toBe('THB');
    expect(c.merchant).toContain('123456');
    expect(c.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(c.confidence).toBeGreaterThan(0.5);
  });

  it('parses US Chase SMS', () => {
    const text = 'CHASE: Your card ending in 1234 was charged $45.67 at STARBUCKS on 01/15';
    const result = parseSMS(text, 'share-target');
    expect(result.candidates.length).toBeGreaterThan(0);
    const c = result.candidates[0];
    expect(c.amount).toBe(45.67);
    expect(c.currency).toBe('USD');
    expect(c.merchant).toBe('STARBUCKS');
    expect(c.confidence).toBeGreaterThan(0.9);
  });

  it('parses generic expense', () => {
    const text = 'Spent $45.67 at STARBUCKS';
    const result = parseSMS(text, 'share-target');
    expect(result.candidates.length).toBeGreaterThan(0);
    const c = result.candidates[0];
    expect(c.amount).toBe(45.67);
    expect(c.merchant).toBe('STARBUCKS');
    expect(c.type).toBe('expense');
  });

  it('parses generic transfer', () => {
    const text = 'Transfer to JOHN DOE $100.00';
    const result = parseSMS(text, 'share-target');
    expect(result.candidates.length).toBeGreaterThan(0);
    const c = result.candidates[0];
    expect(c.amount).toBe(100);
    expect(c.merchant).toBe('JOHN DOE');
    expect(c.type).toBe('transfer');
  });

  it('parses generic refund', () => {
    const text = 'Refund of $25.00 from MERCHANT';
    const result = parseSMS(text, 'share-target');
    expect(result.candidates.length).toBeGreaterThan(0);
    const c = result.candidates[0];
    expect(c.amount).toBe(25);
    expect(c.type).toBe('refund');
  });

  it('parses generic ATM', () => {
    const text = 'ATM withdrawal $200.00';
    const result = parseSMS(text, 'share-target');
    expect(result.candidates.length).toBeGreaterThan(0);
    const c = result.candidates[0];
    expect(c.amount).toBe(200);
    expect(c.type).toBe('atm');
  });

  it('parses generic deposit', () => {
    const text = 'Deposit $500.00';
    const result = parseSMS(text, 'share-target');
    expect(result.candidates.length).toBeGreaterThan(0);
    const c = result.candidates[0];
    expect(c.amount).toBe(500);
    expect(c.type).toBe('income');
  });

  it('returns empty candidates for non-bank text', () => {
    const text = 'Hey, how are you?';
    const result = parseSMS(text, 'share-target');
    expect(result.candidates.length).toBe(0);
  });

  it('deduplicates similar candidates', () => {
    const text = 'CHASE: $45.67 at STARBUCKS on 01/15';
    const result = parseSMS(text, 'share-target');
    const starbucks = result.candidates.filter(c => c.merchant === 'STARBUCKS' && c.amount === 45.67);
    expect(starbucks.length).toBe(1);
  });
});

describe('getBestCandidate', () => {
  it('returns highest confidence candidate', () => {
    const result: ParsedSMSResult = {
      candidates: [
        { amount: 100, currency: 'USD', merchant: 'A', date: '2026-01-01', type: 'expense', confidence: 0.5, rawText: '', source: 'share-target' },
        { amount: 100, currency: 'USD', merchant: 'B', date: '2026-01-01', type: 'expense', confidence: 0.9, rawText: '', source: 'share-target' },
      ],
      rawText: '',
      detectedCountry: 'US',
    };
    const best = getBestCandidate(result);
    expect(best?.merchant).toBe('B');
    expect(best?.confidence).toBe(0.9);
  });

  it('returns null for empty candidates', () => {
    const result: ParsedSMSResult = { candidates: [], rawText: '', detectedCountry: null };
    expect(getBestCandidate(result)).toBeNull();
  });
});

describe('filterByConfidence', () => {
  it('filters by threshold', () => {
    const result: ParsedSMSResult = {
      candidates: [
        { amount: 100, currency: 'USD', merchant: 'A', date: '2026-01-01', type: 'expense', confidence: 0.3, rawText: '', source: 'share-target' },
        { amount: 100, currency: 'USD', merchant: 'B', date: '2026-01-01', type: 'expense', confidence: 0.7, rawText: '', source: 'share-target' },
      ],
      rawText: '',
      detectedCountry: 'US',
    };
    const filtered = filterByConfidence(result, 0.5);
    expect(filtered.candidates.length).toBe(1);
    expect(filtered.candidates[0].merchant).toBe('B');
  });
});

describe('parseSMSArray', () => {
  it('parses multiple SMS', () => {
    const texts = [
      'CHASE: $45.67 at STARBUCKS on 01/15',
      'Spent $23.45 at TARGET',
    ];
    const results = parseSMSArray(texts, 'share-target');
    expect(results.length).toBe(2);
    expect(results[0].candidates.length).toBeGreaterThan(0);
    expect(results[1].candidates.length).toBeGreaterThan(0);
  });
});