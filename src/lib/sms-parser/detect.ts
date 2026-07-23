// Country detection from SMS text
// Uses currency symbols, bank shortcodes, language hints, known patterns

import type { TransactionCandidate } from './types';

const COUNTRY_PATTERNS: Record<string, RegExp[]> = {
  TH: [
    /[฿]/,                    // Thai Baht symbol
    /\b(SCB|KBank|BBL|KTB|TCRB|BAY|TMB|KKP|CIMB)\b/i,  // Major Thai banks (removed UOB - it's Singapore)
    /(ไทย|บาท|เงิน|โอน|ฝาก|ถอน|จ่าย|รับ)/,  // Thai keywords
    /\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*[฿บาท]/,
  ],
  US: [
    /USD\s*\d[\d,]*(?:\.\d{2})?/,
    /\$\s*\d[\d,]*(?:\.\d{2})?/,
    /\$\d[\d,]*(?:\.\d{2})?/,
    /\b(CHASE|BOA|WELLS|CITI|CAPITAL ONE|AMEX|DISCOVER)\b/i,
    /\b(Bank of America|Wells Fargo|Chase|Citibank|Capital One)\b/i,
  ],
  SG: [
    /\b(SGD|DBS|OCBC|UOB|POSB|StanChart|HSBC|Citibank)\b/i,
    /S\$\s*\d[\d,]*(?:\.\d{2})?/,
    /SGD\s*\d[\d,]*(?:\.\d{2})?/,
  ],
  EU: [
    /\b(EUR|€)\s*\d[\d.,]*/,
    /\b(Revolut|N26|Bunq|Wise|ING|Deutsche Bank|BNP|Santander|BBVA|Intesa|Unicredit)\b/i,
    /\b(SEPA|IBAN|BIC|SWIFT)\b/i,
  ],
  GB: [
    /\b(GBP|£)\s*\d[\d.,]*/,
    /\b(Monzo|Starling|Revolut|Barclays|HSBC|Lloyds|NatWest|Santander UK|Nationwide)\b/i,
  ],
  AU: [
    /\b(AUD|A\$)\s*\d[\d.,]*/,
    /\$\s*\d[\d,]*(?:\.\d{2})?/,
    /\b(CommBank|ANZ|Westpac|NAB|Macquarie|ING Australia|Up Bank)\b/i,
  ],
  CA: [
    /\b(CAD|C\$)\s*\d[\d.,]*/,
    /\$\s*\d[\d,]*(?:\.\d{2})?/,
    /\b(RBC|TD|Scotiabank|BMO|CIBC|Tangerine|Simplii|Wealthsimple)\b/i,
  ],
  HK: [
    /\bHKD\s*\d[\d.,]*/,
    /\b(HSBC|Hang Seng|Bank of China|Standard Chartered|Citibank|BEA)\b/i,
  ],
  JP: [
    /¥\s*\d[\d,.]*/,
    /\b(JPY|¥)\s*\d[\d,.]*/,
    /\b(三菱UFJ|みずほ|三井住友|りそな|楽天|PayPay|LINE Pay)\b/,
  ],
  CN: [
    /微信支付|支付宝/,
    /¥\s*\d[\d,.]*/,
    /\b(CNY|¥|元)\s*\d[\d,.]*/,
    /\b(工商银行|农业银行|中国银行|建设银行|招商银行|浦发银行|微信|支付宝)\b/,
  ],
  IN: [
    /\b(INR|₹|Rs\.?)\s*\d[\d.,]*/,
    /\b(HDFC|ICICI|SBI|Axis|Kotak|Yes Bank|IDFC|Paytm|PhonePe|Google Pay)\b/i,
  ],
  MY: [
    /\b(MYR|RM)\s*\d[\d.,]*/,
    /\b(Maybank|CIMB|Public Bank|RHB|Hong Leong|AmBank|Bank Islam|Touch 'n Go|Boost|GrabPay)\b/i,
  ],
  PH: [
    /\b(PHP|₱)\s*\d[\d.,]*/,
    /\b(BDO|BPI|Metrobank|UnionBank|LandBank|GCash|Maya|PayMaya)\b/i,
  ],
  ID: [
    /\b(IDR|Rp)\s*\d[\d.,]*/,
    /\b(Mandiri|BCA|BNI|BRI|Danamon|Permata|OVO|GoPay|DANA|ShopeePay)\b/i,
  ],
  VN: [
    /\b(VND|₫)\s*\d[\d.,]*/,
    /\b(Vietcombank|BIDV|VietinBank|Agribank|Techcombank|VPBank|MoMo|ZaloPay|ShopeePay)\b/i,
  ],
  KR: [
    /\b(KRW|₩)\s*\d[\d,]*/,
    /\b(국민|신한|우리|하나|농협|카카오뱅크|토스|네이버페이)\b/,
  ],
  TW: [
    /\b(TWD|NT\$)\s*\d[\d,]*/,
    /\b(台新|國泰|富邦|華南|第一|合庫|Line Pay|街口|Pi錢包)\b/,
  ],
  AE: [
    /\b(AED|د\.إ)\s*\d[\d.,]*/,
    /\b(Emirates NBD|ADCB|FAB|Mashreq|DIB|ADIB|RAKBANK)\b/i,
  ],
  SA: [
    /\b(SAR|ر\.س)\s*\d[\d.,]*/,
    /\b(الراجحي|الأهلي|الرياض|بلاد|السعودي الفرنسي|STC Pay|Apple Pay)\b/,
  ],
  ZA: [
    /\b(ZAR|R)\s*\d[\d.,]*/,
    /\b(Standard Bank|FNB|Absa|Nedbank|Capitec|Investec|TymeBank|Discovery Bank)\b/i,
  ],
  BR: [
    /\b(BRL|R\$)\s*\d[\d.,]*/,
    /\b(Itaú|Bradesco|Banco do Brasil|Santander|Nubank|Inter|C6|PicPay|Mercado Pago)\b/i,
  ],
  MX: [
    /\b(MXN|\$)\s*\d[\d.,]*/,
    /\b(BBVA|Banorte|Santander|HSBC|Citibanamex|Nu México|Clip|Mercado Pago)\b/i,
  ],
  NG: [
    /\b(NGN|₦)\s*\d[\d.,]*/,
    /\b(Access|GTBank|Zenith|UBA|First Bank|Kuda|Opay|PalmPay|Flutterwave)\b/i,
  ],
  KE: [
    /\b(KES|KSh)\s*\d[\d.,]*/,
    /\b(Equity|KCB|Co-op|Absa|Stanbic|M-Pesa|Airtel Money)\b/i,
  ],
};

/**
 * Detects country from SMS text using weighted pattern matching.
 * Returns ISO 3166-1 alpha-2 code or 'generic' if no strong match.
 */
export function detectCountry(text: string): string {
  const normalized = text.toLowerCase();
  let bestMatch = 'generic';
  let bestScore = 0;

  for (const [country, patterns] of Object.entries(COUNTRY_PATTERNS)) {
    let score = 0;
    for (const pattern of patterns) {
      const matches = normalized.match(pattern);
      if (matches) {
        // Weight: bank names = 3, currency symbols = 2, keywords = 1
        const source = pattern.source;
        if (source.includes('Bank') || source.includes('銀行') || source.includes('은행') || source.includes('银行') ||
            source.includes('SCB') || source.includes('KBank') || source.includes('BBL') || source.includes('KTB') ||
            source.includes('DBS') || source.includes('OCBC') || source.includes('UOB') ||
            source.includes('Chase') || source.includes('Wells') || source.includes('Citi') ||
            source.includes('Capital One') || source.includes('Amex') || source.includes('Revolut') ||
            source.includes('N26') || source.includes('Wise') || source.includes('Monzo') ||
            source.includes('Starling') || source.includes('CommBank') || source.includes('RBC') ||
            source.includes('HDFC') || source.includes('ICICI')) {
          score += 3;
        } else if (source.includes('฿') || source.includes('$') || source.includes('€') || source.includes('£') ||
                   source.includes('¥') || source.includes('₹') || source.includes('₩') || source.includes('₫') ||
                   source.includes('₦') || source.includes('₽') || source.includes('₴') || source.includes('₸') ||
                   source.includes('₺') || source.includes('₼') || source.includes('₾')) {
          score += 2;
        } else {
          score += 1;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = country;
    }
  }

  // Require minimum confidence
  return bestScore >= 2 ? bestMatch : 'generic';
}

/**
 * Get currency code for a country
 */
const COUNTRY_CURRENCY: Record<string, string> = {
  TH: 'THB', US: 'USD', SG: 'SGD', EU: 'EUR', GB: 'GBP',
  AU: 'AUD', CA: 'CAD', HK: 'HKD', JP: 'JPY', CN: 'CNY',
  IN: 'INR', MY: 'MYR', PH: 'PHP', ID: 'IDR', VN: 'VND',
  KR: 'KRW', TW: 'TWD', AE: 'AED', SA: 'SAR', ZA: 'ZAR',
  BR: 'BRL', MX: 'MXN', NG: 'NGN', KE: 'KES',
};
export function countryToCurrency(country: string): string {
  return COUNTRY_CURRENCY[country] || 'USD';
}

/**
 * Normalize amount string to number (handles various formats)
 */
const CURRENCY_SYMBOLS_RE = /[$€£¥₹฿₩₫₦₽₴₸₺₼₾₾]/g;
export function normalizeAmount(str: string): number | null {
  if (!str) return null;
  let s = str.trim();
  // Remove currency symbols
  s = s.replace(CURRENCY_SYMBOLS_RE, '');
  // Remove spaces
  s = s.replace(/\s+/g, '');
  // Handle parentheses as negative (accounting format)
  s = s.replace(/[()]/g, '');
  // If both comma and dot, last separator is decimal
  if (s.includes(',') && s.includes('.')) {
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    if (lastComma > lastDot) {
      // Comma is decimal: 1.234,56 -> remove dots, replace comma with dot
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // Dot is decimal: 1,234.56 -> remove commas
      s = s.replace(/,/g, '');
    }
  } else if (s.includes(',')) {
    // Single comma - check if decimal separator
    const lastComma = s.lastIndexOf(',');
    const after = s.slice(lastComma + 1);
    if (/^\d{1,2}$/.test(after) && s.indexOf(',') === lastComma) {
      s = s.replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  }
  const num = Number(s);
  if (!Number.isFinite(num)) return null;
  // For expense tracking, we want positive magnitude
  return Math.abs(num);
}

/**
 * Normalize date string to ISO yyyy-mm-dd
 */
export function normalizeDate(str: string): string | null {
  if (!str) return null;
  const s = str.trim();
  // ISO-like
  const iso = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (iso) {
    const [, y, m, d] = iso;
    return toIso(Number(y), Number(m), Number(d));
  }
  // dd/mm/yyyy or mm/dd/yyyy or dd/mm/yy
  const parts = s.split(/[-/.\\s]+/).map(p => p.trim());
  if (parts.length >= 3) {
    const [a, b, c] = parts;
    const na = Number(a), nb = Number(b);
    const isTwoDigitYear = c.length <= 2;
    const year = isTwoDigitYear ? 2000 + Number(c) : Number(c);
    let month: number, day: number;
    if (isTwoDigitYear) {
      day = na; month = nb; // dd/mm/yy
    } else if (nb > 12 && na <= 12) {
      // First part <= 12, second > 12 -> mm/dd/yyyy (US format like 01/15/2026)
      month = na; day = nb;
    } else if (na > 12 && nb <= 12) {
      // First part > 12, second <= 12 -> dd/mm/yyyy
      day = na; month = nb;
    } else if (na > 12 && nb > 12) {
      // Both > 12, ambiguous but rare - try dd/mm
      day = na; month = nb;
    } else {
      // Both <= 12, ambiguous -> default to US mm/dd/yyyy
      month = na; day = nb;
    }
    return toIso(year, month, day);
  }
  // Fallback to native Date
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return null;
}

function toIso(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const probe = new Date(year, month - 1, day);
  if (probe.getFullYear() !== year || probe.getMonth() !== month - 1 || probe.getDate() !== day) {
    return null;
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Extract potential merchant name from text
 */
export function extractMerchant(text: string, amountStr: string): string {
  // Remove amount from text
  let cleaned = text.replace(amountStr, '').trim();
  // Remove common transaction words
  cleaned = cleaned.replace(/\b(Spent|Purchase|Paid|Charge|Debit|Credit|Refund|Deposit|Withdrawal|Transfer|Payment|Received|Sent|To|From|At|Via|On|Card|Account|Balance|Available|Ref|Transaction|TXN|ID|Reference|Auth|Code|CHASE|BANK|ALERT|DBS|OCBC|UOB|POSB|StanChart|OCBC|UOB)\b/gi, '');
  // Remove numbers, special chars
  cleaned = cleaned.replace(/[\d$€£¥₹฿₩₫₦₽₴₸₺₼₾#@*:/]+/g, ' ').trim();
  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  // Take first reasonable segment
  const words = cleaned.split(' ');
  if (words.length > 4) return words.slice(0, 4).join(' ');
  return cleaned || 'Unknown Merchant';
}

/**
 * Determine transaction type from text
 */
export function detectType(text: string): TransactionCandidate['type'] {
  const t = text.toLowerCase();
  if (/\b(refund|reversal|returned|credited back)\b/i.test(t)) return 'refund';
  if (/\b(transfer|sent to|received from|p2p|peer)\b/i.test(t)) return 'transfer';
  if (/\b(sent)\b/i.test(t)) return 'transfer';  // "Sent $50 to Jane"
  if (/\b(atm|cash withdrawal|cash advance)\b/i.test(t)) return 'atm';
  if (/\b(fee|charge|commission|service fee|annual fee)\b/i.test(t)) return 'fee';
  if (/\b(deposit|credit|salary|income|received|top.?up|topup|added)\b/i.test(t)) return 'income';
  return 'expense';
}