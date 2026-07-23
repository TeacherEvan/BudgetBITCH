import type { SMSPattern } from '../types';
import { normalizeAmount, normalizeDate, extractMerchant } from '../detect';

export const thaiPatterns: SMSPattern[] = [
  {
    name: 'th-scb',
    country: 'TH',
    regex: /\bSCB\s+แจ้งยอด(?:ฝาก|ถอน|โอน)\s+([\d,]+\.?\d*)\s*บาท\s+(?:จาก|ไปยัง)?\s*([A-Za-z0-9\s]{2,30})?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/,
    extract: (match) => ({
      amount: normalizeAmount(match[1]) || 0,
      currency: 'THB',
      merchant: match[2]?.trim() || 'SCB Transaction',
      date: normalizeDate(match[3]) || undefined,
    }),
    priority: 50,
    confidence: 0.9,
  },
  {
    name: 'th-kbank',
    country: 'TH',
    regex: /\bKPLUS\s+แจ้งยอด(?:โอนเข้าบัญชี|ฝาก|ถอน)\s+([\d,]+\.?\d*)\s*บาท\s+(?:จาก|ไปยัง)?\s*([A-Za-z0-9\s]{2,30})?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/,
    extract: (match) => ({
      amount: normalizeAmount(match[1]) || 0,
      currency: 'THB',
      merchant: match[2]?.trim() || 'KBank Transaction',
      date: normalizeDate(match[3]) || undefined,
    }),
    priority: 50,
    confidence: 0.9,
  },
  {
    name: 'th-bbl',
    country: 'TH',
    regex: /\bBBL\s+แจ้งยอด(?:จ่าย|ฝาก|โอน)\s+([\d,]+\.?\d*)\s*บาท\s+(?:ที่|จาก)?\s*([A-Za-z0-9\s]{2,30})?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/,
    extract: (match) => ({
      amount: normalizeAmount(match[1]) || 0,
      currency: 'THB',
      merchant: match[2]?.trim() || 'BBL Transaction',
      date: normalizeDate(match[3]) || undefined,
    }),
    priority: 50,
    confidence: 0.9,
  },
  {
    name: 'th-ktb',
    country: 'TH',
    regex: /\bKTB\s+แจ้งยอด(?:ซื้อสินค้า|จ่าย|ฝาก|ถอน)\s+([\d,]+\.?\d*)\s*บาท\s+(?:ที่|จาก)?\s*([A-Za-z0-9\s]{2,30})?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/,
    extract: (match) => ({
      amount: normalizeAmount(match[1]) || 0,
      currency: 'THB',
      merchant: match[2]?.trim() || 'KTB Transaction',
      date: normalizeDate(match[3]) || undefined,
    }),
    priority: 50,
    confidence: 0.9,
  },
  {
    name: 'th-generic-baht',
    country: 'TH',
    regex: /([\d,]+\.?\d*)\s*บาท\s+(?:ที่|จาก)?\s*([A-Za-z0-9\s]{2,30})?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/,
    extract: (match) => ({
      amount: normalizeAmount(match[1]) || 0,
      currency: 'THB',
      merchant: match[2]?.trim() || 'Thai Transaction',
      date: normalizeDate(match[3]) || undefined,
    }),
    priority: 30,
    confidence: 0.7,
  },
];