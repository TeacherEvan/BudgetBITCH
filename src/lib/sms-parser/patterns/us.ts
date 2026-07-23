import type { SMSPattern } from '../types';
import { normalizeAmount, normalizeDate, extractMerchant } from '../detect';

export const usPatterns: SMSPattern[] = [
  {
    name: 'us-chase',
    country: 'US',
    regex: /\bCHASE:\s*(?:Your card ending in \d{4} was\s*)?(?:charged|credited)\s*\$([\d,]+\.?\d*)\s+at\s+([A-Za-z0-9\s&'.-]{2,30})\s+on\s+(\d{1,2}\/\d{1,2})/i,
    extract: (match) => ({
      amount: normalizeAmount(match[1]) || 0,
      currency: 'USD',
      merchant: match[2].trim(),
      date: normalizeDate(match[3] + '/' + new Date().getFullYear()) || undefined,
    }),
    priority: 50,
    confidence: 0.95,
  },
  {
    name: 'us-chase-simple',
    country: 'US',
    regex: /\bCHASE:\s*\$([\d,]+\.?\d*)\s+at\s+([A-Za-z0-9\s&'.-]{2,30})\s+on\s+(\d{1,2}\/\d{1,2})/i,
    extract: (match) => ({
      amount: normalizeAmount(match[1]) || 0,
      currency: 'USD',
      merchant: match[2].trim(),
      date: normalizeDate(match[3] + '/' + new Date().getFullYear()) || undefined,
    }),
    priority: 45,
    confidence: 0.9,
  },
  {
    name: 'us-bofa',
    country: 'US',
    regex: /\b(?:Alert|Bank of America):\s*\$([\d,]+\.?\d*)\s+(?:purchase|credit|refund)\s+on\s+(?:your\s+)?(?:Visa|Mastercard|Debit)\s+(?:ending\s+\d{4}\s+)?at\s+([A-Za-z0-9\s&'.-]{2,30})\s+(\d{1,2}\/\d{1,2})/i,
    extract: (match) => ({
      amount: normalizeAmount(match[1]) || 0,
      currency: 'USD',
      merchant: match[2].trim(),
      date: normalizeDate(match[3] + '/' + new Date().getFullYear()) || undefined,
    }),
    priority: 50,
    confidence: 0.95,
  },
  {
    name: 'us-wells-fargo',
    country: 'US',
    regex: /\bWells Fargo:\s*\$([\d,]+\.?\d*)\s+(?:purchase|credit|refund)\s+at\s+([A-Za-z0-9\s&'.-]{2,30})\s+on\s+(\d{1,2}\/\d{1,2})/i,
    extract: (match) => ({
      amount: normalizeAmount(match[1]) || 0,
      currency: 'USD',
      merchant: match[2].trim(),
      date: normalizeDate(match[3] + '/' + new Date().getFullYear()) || undefined,
    }),
    priority: 50,
    confidence: 0.95,
  },
  {
    name: 'us-citi',
    country: 'US',
    regex: /\bCiti\s+(?:Card|Alert):\s*\$([\d,]+\.?\d*)\s+at\s+([A-Za-z0-9\s&'.-]{2,30})\s+(\d{1,2}\/\d{1,2})/i,
    extract: (match) => ({
      amount: normalizeAmount(match[1]) || 0,
      currency: 'USD',
      merchant: match[2].trim(),
      date: normalizeDate(match[3] + '/' + new Date().getFullYear()) || undefined,
    }),
    priority: 50,
    confidence: 0.95,
  },
  {
    name: 'us-capital-one',
    country: 'US',
    regex: /\bCapital One:\s*\$([\d,]+\.?\d*)\s+at\s+([A-Za-z0-9\s&'.-]{2,30})\s+(\d{1,2}\/\d{1,2})/i,
    extract: (match) => ({
      amount: normalizeAmount(match[1]) || 0,
      currency: 'USD',
      merchant: match[2].trim(),
      date: normalizeDate(match[3] + '/' + new Date().getFullYear()) || undefined,
    }),
    priority: 50,
    confidence: 0.95,
  },
  {
    name: 'us-amex',
    country: 'US',
    regex: /\bAmex:\s*\$([\d,]+\.?\d*)\s+at\s+([A-Za-z0-9\s&'.-]{2,30})\s+(\d{1,2}\/\d{1,2})/i,
    extract: (match) => ({
      amount: normalizeAmount(match[1]) || 0,
      currency: 'USD',
      merchant: match[2].trim(),
      date: normalizeDate(match[3] + '/' + new Date().getFullYear()) || undefined,
    }),
    priority: 50,
    confidence: 0.95,
  },
  {
    name: 'us-generic-card',
    country: 'US',
    regex: /\b(?:card|account)\s+(?:ending\s+(?:in\s+)?\d{4})\s+(?:was\s+)?(?:charged|credited)\s*\$([\d,]+\.?\d*)\s+at\s+([A-Za-z0-9\s&'.-]{2,30})\s+on\s+(\d{1,2}\/\d{1,2})/i,
    extract: (match) => ({
      amount: normalizeAmount(match[1]) || 0,
      currency: 'USD',
      merchant: match[2].trim(),
      date: normalizeDate(match[3] + '/' + new Date().getFullYear()) || undefined,
    }),
    priority: 30,
    confidence: 0.8,
  },
];