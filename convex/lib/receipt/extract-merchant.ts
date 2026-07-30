import type { NormalisedPayload } from './normalise';
import type { FieldCandidate } from './types';

const MERCHANT_NOISE_PATTERNS = [
  /^TAX\s+INVOICE/i,
  /^VAT\s+REG/i,
  /^TEL/i,
  /^FAX/i,
  /^WWW\./i,
  /^HTTP/i,
  /^WELCOME/i,
  /^THANK\s+YOU/i,
  /^DATE/i,
  /^TIME/i,
  /^CASHIER/i,
  /^TILL/i,
];

export function extractMerchant(payload: NormalisedPayload): FieldCandidate | null {
  // Check top 5 lines
  const topLines = payload.lines.slice(0, 5);

  for (const line of topLines) {
    const text = line.text.trim();
    if (!text || text.length < 2) continue;

    if (MERCHANT_NOISE_PATTERNS.some((pat) => pat.test(text))) {
      continue;
    }

    return {
      value: text,
      conf: 0.85,
      evidenceLine: line,
      ruleId: 'top-line-merchant',
    };
  }

  return null;
}
