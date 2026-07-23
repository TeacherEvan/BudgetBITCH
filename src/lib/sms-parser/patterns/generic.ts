import type { SMSPattern } from '../types';
import { normalizeAmount, normalizeDate, extractMerchant, detectType, countryToCurrency } from '../detect';

export const genericPatterns: SMSPattern[] = [
  {
    name: 'generic-amount-merchant',
    country: undefined,
    regex: /\b(?:spent|purchase|paid|charge|debit)\s+([$€£¥₹฿₩₫₦₽₴₸₺₼₾]?\s*\d[\d.,]*)\s+(?:at|on|from|to)?\s*([A-Za-z0-9\s&'.-]{2,30})/i,
    extract: (match) => ({
      amount: normalizeAmount(match[1]) || 0,
      currency: undefined,
      merchant: match[2]?.trim(),
    }),
    priority: 10,
    confidence: 0.5,
  },
  {
    name: 'generic-card-ending',
    country: undefined,
    regex: /\b(?:VISA|Mastercard|Amex|Discover|Card)\s+(?:ending|ending in|xxx|x{4})\s*(\d{4})\s*([$€£¥₹฿₩₫₦₽₴₸₺₼₾]?\s*\d[\d.,]*)\s+(?:at|on|from|to)?\s*([A-Za-z0-9\s&'.-]{2,30})/i,
    extract: (match) => ({
      amount: normalizeAmount(match[2]) || 0,
      currency: undefined,
      merchant: match[3]?.trim(),
    }),
    priority: 20,
    confidence: 0.65,
  },
  {
    name: 'generic-transfer',
    country: undefined,
    regex: /\b(?:transfer|sent|sent to|received from|paid|received)\s+(?:to|from)?\s*([A-Za-z\s.]{2,30})\s+([$€£¥₹฿₩₫₦₽₴₸₺₼₾]?\s*\d[\d.,]*)/i,
    extract: (match) => ({
      amount: normalizeAmount(match[2]) || 0,
      currency: undefined,
      merchant: match[1].trim(),
      type: 'transfer' as const,
    }),
    priority: 15,
    confidence: 0.6,
  },
  {
    name: 'generic-refund',
    country: undefined,
    regex: /\b(?:refund|reversal|returned)\s+(?:of|for)?\s*([$€£¥₹฿₩₫₦₽₴₸₺₼₾]?\s*\d[\d.,]*)\s+(?:from|at)?\s*([A-Za-z0-9\s&'.-]{2,30})/i,
    extract: (match) => ({
      amount: normalizeAmount(match[1]) || 0,
      currency: undefined,
      merchant: match[2]?.trim(),
      type: 'refund' as const,
    }),
    priority: 15,
    confidence: 0.7,
  },
  {
    name: 'generic-atm',
    country: undefined,
    regex: /\b(?:ATM|cash)\s+(?:withdrawal|advance|withdrawal)\s+([$€£¥₹฿₩₫₦₽₴₸₺₼₾]?\s*\d[\d.,]*)/i,
    extract: (match) => ({
      amount: normalizeAmount(match[1]) || 0,
      currency: undefined,
      merchant: 'ATM Withdrawal',
      type: 'atm' as const,
    }),
    priority: 15,
    confidence: 0.75,
  },
  {
    name: 'generic-deposit-income',
    country: undefined,
    regex: /\b(?:deposit|credited|salary|income|top.?up|topup|added)\s+([$€£¥₹฿₩₫₦₽₴₸₺₼₾]?\s*\d[\d.,]*)/i,
    extract: (match) => ({
      amount: normalizeAmount(match[1]) || 0,
      currency: undefined,
      merchant: 'Deposit',
      type: 'income' as const,
    }),
    priority: 15,
    confidence: 0.65,
  },
  {
    name: 'generic-fee',
    country: undefined,
    regex: /\b(?:fee|charge|commission|service fee|annual fee)\s+([$€£¥₹฿₩₫₦₽₴₸₺₼₾]?\s*\d[\d.,]*)/i,
    extract: (match) => ({
      amount: normalizeAmount(match[1]) || 0,
      currency: undefined,
      merchant: 'Bank Fee',
      type: 'fee' as const,
    }),
    priority: 15,
    confidence: 0.7,
  },
];