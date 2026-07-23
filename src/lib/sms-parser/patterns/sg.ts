import type { SMSPattern } from '../types';
import { normalizeAmount, normalizeDate, extractMerchant } from '../detect';

export const sgPatterns: SMSPattern[] = [
  {
    name: 'sg-dbs',
    country: 'SG',
    regex: /\bDBS\s+Alert:\s*SGD\s*([\d,]+\.?\d*)\s+(?:spent|credited|refunded)\s+at\s+([A-Za-z0-9\s&'.-]{2,30})\s+on\s+(\d{1,2}\/\d{1,2})/i,
    extract: (match) => ({
      amount: normalizeAmount(match[1]) || 0,
      currency: 'SGD',
      merchant: match[2].trim(),
      date: normalizeDate(match[3] + '/' + new Date().getFullYear()) || undefined,
    }),
    priority: 50,
    confidence: 0.95,
  },
  {
    name: 'sg-ocbc',
    country: 'SG',
    regex: /\bOCBC:\s*\$([\d,]+\.?\d*)\s+(?:charged|credited)\s+to\s+your\s+card\s+at\s+([A-Za-z0-9\s&'.-]{2,30})\s+(\d{1,2}\/\d{1,2})/i,
    extract: (match) => ({
      amount: normalizeAmount(match[1]) || 0,
      currency: 'SGD',
      merchant: match[2].trim(),
      date: normalizeDate(match[3] + '/' + new Date().getFullYear()) || undefined,
    }),
    priority: 50,
    confidence: 0.95,
  },
  {
    name: 'sg-uob',
    country: 'SG',
    regex: /\bUOB\s+(?:Card|Alert).*?(?:ending\s+\d{4})?:\s*SGD\s*([\d,]+\.?\d*)\s+at\s+([A-Za-z0-9\s&'.-]{2,30})\s+(\d{1,2}\/\d{1,2})/i,
    extract: (match) => ({
      amount: normalizeAmount(match[1]) || 0,
      currency: 'SGD',
      merchant: match[2].trim(),
      date: normalizeDate(match[3] + '/' + new Date().getFullYear()) || undefined,
    }),
    priority: 50,
    confidence: 0.95,
  },
  {
    name: 'sg-generic',
    country: 'SG',
    regex: /\b(DBS|OCBC|UOB|POSB|StanChart)\b.*?(?:SGD|\$)\s*([\d,]+\.?\d*)\s+(?:spent|charged|credited|at)\s+([A-Za-z0-9\s&'.-]{2,30})/i,
    extract: (match) => ({
      amount: normalizeAmount(match[2]) || 0,
      currency: 'SGD',
      merchant: match[3].trim(),
    }),
    priority: 30,
    confidence: 0.7,
  },
];