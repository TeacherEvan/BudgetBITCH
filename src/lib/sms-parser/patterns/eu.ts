import type { SMSPattern } from '../types';
import { normalizeAmount, extractMerchant } from '../detect';

export const euPatterns: SMSPattern[] = [
  {
    name: 'eu-revolut',
    country: 'EU',
    regex: /\b(?:You\s+)?spent\s+EUR\s*([\d,]+\.?\d*)\s+at\s+([A-Za-z0-9\s&'.-]{2,30})/i,
    extract: (match) => ({
      amount: normalizeAmount(match[1]) || 0,
      currency: 'EUR',
      merchant: match[2].trim(),
    }),
    priority: 50,
    confidence: 0.9,
  },
  {
    name: 'eu-n26',
    country: 'EU',
    regex: /\bN26:\s*You\s+paid\s+EUR\s*([\d,]+\.?\d*)\s+to\s+([A-Za-z0-9\s&'.-]{2,30})/i,
    extract: (match) => ({
      amount: normalizeAmount(match[1]) || 0,
      currency: 'EUR',
      merchant: match[2].trim(),
    }),
    priority: 50,
    confidence: 0.9,
  },
  {
    name: 'eu-wise',
    country: 'EU',
    regex: /\bWise:\s*You\s+(?:sent|received)\s+EUR\s*([\d,]+\.?\d*)\s+to\s+([A-Za-z0-9\s&'.-]{2,30})/i,
    extract: (match) => ({
      amount: normalizeAmount(match[1]) || 0,
      currency: 'EUR',
      merchant: match[2].trim(),
      type: 'transfer' as const,
    }),
    priority: 50,
    confidence: 0.9,
  },
];