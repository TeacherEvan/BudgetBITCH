import type { NormalisedPayload } from './normalise';

/**
 * Currency symbol → ISO code + display symbol map.
 * Order matters: longer prefixes (A$, C$) must precede bare $.
 */
export const CURRENCY_MAP: Array<{ pattern: RegExp; code: string; symbol: string }> = [
  { pattern: /\bA\$\s*|AUD\b/i, code: 'AUD', symbol: 'A$' },
  { pattern: /\bC\$\s*|CAD\b/i, code: 'CAD', symbol: 'C$' },
  { pattern: /\bNZ\$\s*|NZD\b/i, code: 'NZD', symbol: 'NZ$' },
  { pattern: /\bSG\$\s*|SGD\b/i, code: 'SGD', symbol: 'SG$' },
  { pattern: /\bHK\$\s*|HKD\b/i, code: 'HKD', symbol: 'HK$' },
  { pattern: /\bUS\$\s*|\$|USD\b/i, code: 'USD', symbol: '$' },
  { pattern: /€|EUR\b/i, code: 'EUR', symbol: '€' },
  { pattern: /£|GBP\b/i, code: 'GBP', symbol: '£' },
  { pattern: /\bR\s*\d|\bZAR\b/i, code: 'ZAR', symbol: 'R' },
  { pattern: /¥|JPY\b|CNY\b/i, code: 'JPY', symbol: '¥' },
  { pattern: /₹|INR\b/i, code: 'INR', symbol: '₹' },
  { pattern: /₱|PHP\b/i, code: 'PHP', symbol: '₱' },
  { pattern: /₩|KRW\b/i, code: 'KRW', symbol: '₩' },
  { pattern: /\bCHF\b/i, code: 'CHF', symbol: 'CHF' },
];

/**
 * Category keywords — mapped to Budget Boss VALID_CATEGORIES.
 * Note: hf_bot used 'groceries','dining','travel','utilities','supplies'.
 * Budget Boss uses 'food','transport','shopping','utilities','entertainment',
 * 'medical','housing','personal','education','income','other'.
 * We map hf_bot categories → Budget Boss categories here.
 */
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: [
    'starbucks', 'mcdonalds', 'kfc', 'burger', 'cafe', 'coffee', 'restaurant', 'bistro', 'bar', 'grill', 'pizza', 'subway',
    'supermarket', 'grocery', 'walmart', 'target', 'woolworths', 'pick n pay', 'carrefour', 'tesco', 'rewe', 'milk', 'bread', 'food'
  ],
  dining: [
    // Intentionally empty — food covers dining in Budget Boss
  ],
  transport: ['uber', 'bolt', 'lyft', 'grab', 'shell', 'bp', 'chevron', 'total', 'petrol', 'gas', 'fuel', 'parking', 'airline', 'flight'],
  utilities: ['electricity', 'water', 'wifi', 'internet', 'verizon', 't-mobile', 'vodafone', 'telecom'],
  shopping: ['office', 'stationery', 'staples', 'paper', 'hardware', 'homedepot'],
};

/**
 * Detect currency ISO code and display symbol from raw receipt text.
 * Returns { code, symbol } — never undefined.
 */
export function detectCurrency(text: string): { code: string; symbol: string } {
  for (const { pattern, code, symbol } of CURRENCY_MAP) {
    if (pattern.test(text)) {
      return { code, symbol };
    }
  }
  return { code: 'USD', symbol: '$' };
}

/**
 * Extract a floating-point monetary amount from text.
 * Handles $45.20, 1,234.50, 120.00, 45,20 (European decimal comma).
 * Returns 0.0 if no amount found.
 */
export function parseAmount(text: string): number {
  if (!text) return 0.0;

  // Primary: decimal with dot (1,234.50 or 45.20)
  const dotMatch = text.match(/[\d,]+\.\d{2}\b/);
  if (dotMatch) {
    const cleaned = dotMatch[0].replace(/,/g, '');
    const val = parseFloat(cleaned);
    if (!Number.isNaN(val) && val > 0) return val;
  }

  // Fallback: European decimal comma (45,20)
  const commaMatch = text.match(/\b\d+,\d{2}\b/);
  if (commaMatch) {
    const cleaned = commaMatch[0].replace(',', '.');
    const val = parseFloat(cleaned);
    if (!Number.isNaN(val) && val > 0) return val;
  }

  // Loose fallback: any number
  const looseMatch = text.match(/\b\d+[.,]?\d*\b/);
  if (looseMatch) {
    const cleaned = looseMatch[0].replace(',', '.');
    const val = parseFloat(cleaned);
    if (!Number.isNaN(val) && val > 0) return val;
  }

  return 0.0;
}

/**
 * Parse date from text, using currency as a locale hint for ambiguous DD/MM vs MM/DD.
 * Returns ISO YYYY-MM-DD or null.
 */
export function parseDate(text: string, currency: string = 'USD'): string | null {
  if (!text) return null;

  // 1. ISO YYYY-MM-DD
  const isoMatch = text.match(/\b(20\d{2})[-/\.](0[1-9]|1[0-2])[-/\.](0[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // 2. Slash/Dash dates: DD/MM/YYYY or MM/DD/YYYY
  const slashMatch = text.match(/\b(0[1-9]|[12]\d|3[01])[-/\.](0[1-9]|[12]\d|3[01])[-/\.](20\d{2})\b/);
  if (slashMatch) {
    const g1 = parseInt(slashMatch[1], 10);
    const g2 = parseInt(slashMatch[2], 10);
    const year = slashMatch[3];

    if (g1 > 12) {
      // g1 is day → DD/MM/YYYY
      return `${year}-${String(g2).padStart(2, '0')}-${String(g1).padStart(2, '0')}`;
    }
    if (g2 > 12) {
      // g2 is day → MM/DD/YYYY
      return `${year}-${String(g1).padStart(2, '0')}-${String(g2).padStart(2, '0')}`;
    }

    // Ambiguous: use currency as locale hint
    // USD/CAD default to MM/DD; others default to DD/MM
    const isUSLocale = currency === 'USD' || currency === 'CAD';
    if (isUSLocale) {
      return `${year}-${String(g1).padStart(2, '0')}-${String(g2).padStart(2, '0')}`;
    } else {
      return `${year}-${String(g2).padStart(2, '0')}-${String(g1).padStart(2, '0')}`;
    }
  }

  // 3. DD-Mon-YYYY (e.g., 01-Aug-2026)
  const monMatch = text.match(/\b(\d{1,2})[-/\s]+([A-Za-z]{3})[-/\s]+(20\d{2})\b/);
  if (monMatch) {
    const dayStr = monMatch[1];
    const monStr = monMatch[2];
    const yearStr = monMatch[3];
    const months: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };
    const monLower = monStr.toLowerCase();
    if (months[monLower]) {
      return `${yearStr}-${months[monLower]}-${dayStr.padStart(2, '0')}`;
    }
  }

  return null;
}

/**
 * Infer Budget Boss category from merchant + receipt text.
 * Maps hf_bot keywords → Budget Boss VALID_CATEGORIES.
 * Falls back to 'other'.
 */
export function inferCategory(merchant: string, text: string): string {
  const combined = `${merchant} ${text}`.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => combined.includes(kw.toLowerCase()))) {
      return category;
    }
  }
  return 'other';
}

/**
 * Extract currency hint from OCR payload (for country/template fallback).
 */
export function extractCurrencyHint(payload: NormalisedPayload): string | undefined {
  const fullText = payload.lines.map((l) => l.text).join(' ');
  const { code } = detectCurrency(fullText);
  return code;
}