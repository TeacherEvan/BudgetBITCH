/**
 * Payment method inference from receipt text.
 * Returns 'card' or 'cash' — maps to Budget Boss conventions.
 */
const CARD_INDICATORS = [
  /\bVISA\b/i,
  /\bMASTERCARD\b/i,
  /\bMASTER\s*CARD\b/i,
  /\bAMEX\b/i,
  /\bAMERICAN\s*EXPRESS\b/i,
  /\bAPPLE\s*PAY\b/i,
  /\bGOOGLE\s*PAY\b/i,
  /\bSAMSUNG\s*PAY\b/i,
  /\bCONTACTLESS\b/i,
  /\bCARD\b/i,
  /\bDEBIT\b/i,
  /\bCREDIT\b/i,
];

/**
 * Infer payment method from raw receipt text.
 * Returns 'card' if any card indicator found, otherwise 'cash'.
 */
export function inferPaymentMethod(text: string): 'card' | 'cash' {
  if (!text) return 'cash';

  for (const pattern of CARD_INDICATORS) {
    if (pattern.test(text)) {
      return 'card';
    }
  }
  return 'cash';
}