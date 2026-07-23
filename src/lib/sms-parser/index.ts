// Main SMS Parser entry point
// International pluggable parser for bank SMS messages

import { detectCountry, countryToCurrency, extractMerchant, detectType } from './detect';
import type { TransactionCandidate, ParsedSMSResult } from './types';
import { getPatternsForCountry } from './patterns';

// Cache one global-flag RegExp per pattern source so parseSMS does not
// recompile a RegExp object on every SMS (the previous `.sort().matchAll(new
// RegExp(...))` allocated a fresh RegExp per pattern per call).
const globalRegexCache = new Map<RegExp, RegExp>();
function globalRegex(re: RegExp): RegExp {
  let cached = globalRegexCache.get(re);
  if (!cached) {
    cached = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    globalRegexCache.set(re, cached);
  }
  return cached;
}

/**
 * Parse SMS text and extract transaction candidates
 * @param text Raw SMS text
 * @param source Source of the SMS (share-target, notification-listener, manual-paste)
 * @returns ParsedSMSResult with candidates sorted by confidence
 */
export function parseSMS(text: string, source: TransactionCandidate['source'] = 'share-target'): ParsedSMSResult {
  if (!text || text.trim() === '') {
    return { candidates: [], rawText: text, detectedCountry: null };
  }

  const rawText = text.trim();
  const detectedCountry = detectCountry(rawText);
  const patterns = getPatternsForCountry(detectedCountry);

  const candidates: TransactionCandidate[] = [];

  for (const pattern of patterns) {
    const matches = rawText.matchAll(globalRegex(pattern.regex));
    for (const match of matches) {
      try {
        const extracted = pattern.extract(match, rawText);
        
        // Only create candidate if we have a valid amount
        if (extracted.amount && extracted.amount > 0) {
          const candidate: TransactionCandidate = {
            amount: extracted.amount,
            currency: extracted.currency || countryToCurrency(detectedCountry) || 'USD',
            merchant: extracted.merchant || extractMerchant(rawText, String(extracted.amount)),
            date: extracted.date || new Date().toISOString().slice(0, 10),
            type: extracted.type || detectType(rawText),
            confidence: Math.min(pattern.confidence + (extracted.confidenceBoost ?? 0), 1.0),
            rawText,
            source,
            detectedCountry: detectedCountry === 'generic' ? undefined : detectedCountry,
          };
          candidates.push(candidate);
        }
      } catch (e) {
        // Silently skip malformed extractions
        console.debug('SMS pattern extraction error:', e);
      }
    }
  }

  // Deduplicate by (amount, merchant, date) - keep highest confidence
  const deduped = deduplicateCandidates(candidates);
  
  // Sort by confidence descending
  deduped.sort((a, b) => b.confidence - a.confidence);

  return {
    candidates: deduped,
    rawText,
    detectedCountry: detectedCountry === 'generic' ? null : detectedCountry,
  };
}

/**
 * Remove duplicate candidates (same amount, merchant, date)
 * Keeps the one with highest confidence
 */
function deduplicateCandidates(candidates: TransactionCandidate[]): TransactionCandidate[] {
  const seen = new Map<string, TransactionCandidate>();
  
  for (const c of candidates) {
    const key = `${c.amount}:${c.merchant.toLowerCase()}:${c.date}`;
    const existing = seen.get(key);
    if (!existing || c.confidence > existing.confidence) {
      seen.set(key, c);
    }
  }
  
  return Array.from(seen.values());
}

// Pre-compiled pre-filter regexes (hoisted to module scope so they are not
// recompiled on every call to looksLikeBankSMS).
const AMOUNT_RE = /[$€£¥₹฿₩₫₦₽₴₸₺₼₾]\s*\d|\b\d[\d.,]*\s*(?:THB|USD|EUR|GBP|SGD|AUD|CAD|HKD|JPY|CNY|INR|MYR|PHP|IDR|VND|KRW|TWD|AED|SAR|ZAR|BRL|MXN|NGN|KES)\b|\d[\d.,]*\s*(?:baht|usd|eur|gbp|sgd|aud|cad|hkd|jpy|cny|inr|myr|php|idr|vnd|krw|twd|aed|sar|zar|brl|mxn|ngn|kes|บาท|元|円|원|₱|₫|₹|₩|₽|₺|₾)/i;
const KEYWORDS_RE = /\b(spent|purchase|paid|charge|charged|debit|credit|refund|transfer|sent|received|deposit|withdrawal|atm|fee|balance|account|card|ending|at|chase|dbs|ocbc|uob|paypay|visa|mastercard|amex|bank|alert)\b/i;
const THAI_KEYWORDS_RE = /(ฝาก|ถอน|โอน|จ่าย|รับ)/i;

/**
 * Quick check if text looks like a bank SMS
 * Used for pre-filtering before full parse
 */
export function looksLikeBankSMS(text: string): boolean {
  const t = text.toLowerCase();
  const hasAmount = AMOUNT_RE.test(t);
  const hasKeywords = KEYWORDS_RE.test(t) || THAI_KEYWORDS_RE.test(t);
  return hasAmount && hasKeywords;
}

/**
 * Parse multiple SMS messages (batch)
 */
export function parseSMSArray(texts: string[], source: TransactionCandidate['source'] = 'share-target'): ParsedSMSResult[] {
  return texts.map(t => parseSMS(t, source));
}

/**
 * Get the best candidate (highest confidence) from parsed result
 */
export function getBestCandidate(result: ParsedSMSResult): TransactionCandidate | null {
  if (!result.candidates.length) return null;
  return result.candidates.reduce((best, current) => 
    current.confidence > best.confidence ? current : best
  );
}

/**
 * Filter candidates by minimum confidence threshold
 */
export function filterByConfidence(result: ParsedSMSResult, minConfidence: number = 0.5): ParsedSMSResult {
  return {
    ...result,
    candidates: result.candidates.filter(c => c.confidence >= minConfidence),
  };
}

// Re-export types and utilities
export type { TransactionCandidate, ParsedSMSResult, TransactionType } from './types';
export { detectCountry, countryToCurrency, normalizeAmount, normalizeDate, extractMerchant, detectType } from './detect';
export { allPatterns, getPatternsForCountry } from './patterns';