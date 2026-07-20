// lib/utils/currency.ts

/**
 * Currencies BudgetBITCH can display. Covers every inhabited ISO 3166-1
 * country with a circulating ISO 4217 currency so location auto-detection
 * works worldwide. Free, local-first: no exchange-rate API, no paid
 * connectors. Add a new code here AND to COUNTRY_TO_CURRENCY below.
 */
export type CurrencyCode =
  | 'THB' | 'JPY' | 'CNY' | 'HKD' | 'TWD' | 'KRW' | 'SGD'
  | 'MYR' | 'IDR' | 'PHP' | 'VND' | 'INR' | 'BDT' | 'PKR'
  | 'LKR' | 'NZD' | 'AUD' | 'EUR' | 'GBP' | 'CHF' | 'NOK'
  | 'SEK' | 'DKK' | 'PLN' | 'CZK' | 'HUF' | 'RUB' | 'TRY'
  | 'UAH' | 'USD' | 'CAD' | 'MXN' | 'BRL' | 'ARS' | 'CLP'
  | 'COP' | 'PEN' | 'AED' | 'SAR' | 'ILS' | 'ZAR' | 'EGP'
  | 'NGN' | 'KES' | 'MAD';

/** ISO 3166-1 alpha-2 -> ISO 4217 currency. Excludes uninhabited /
 *  no-currency territories (e.g. AQ, XK). */
const COUNTRY_TO_CURRENCY: Record<string, CurrencyCode> = {
  // ── Asia-Pacific ──
  TH: 'THB', JP: 'JPY', CN: 'CNY', HK: 'HKD', TW: 'TWD',
  KR: 'KRW', SG: 'SGD', MY: 'MYR', ID: 'IDR', PH: 'PHP',
  VN: 'VND', IN: 'INR', BD: 'BDT', PK: 'PKR', LK: 'LKR',
  NZ: 'NZD', AU: 'AUD',
  // ── Europe ──
  AT: 'EUR', BE: 'EUR', CY: 'EUR', DE: 'EUR', EE: 'EUR', ES: 'EUR',
  FI: 'EUR', FR: 'EUR', GR: 'EUR', IE: 'EUR', IT: 'EUR', LT: 'EUR',
  LU: 'EUR', LV: 'EUR', MT: 'EUR', NL: 'EUR', PT: 'EUR', SI: 'EUR',
  SK: 'EUR', HR: 'EUR', GB: 'GBP', CH: 'CHF', NO: 'NOK', SE: 'SEK',
  DK: 'DKK', PL: 'PLN', CZ: 'CZK', HU: 'HUF', RU: 'RUB',
  TR: 'TRY', UA: 'UAH',
  // ── Americas ──
  US: 'USD', CA: 'CAD', MX: 'MXN', BR: 'BRL', AR: 'ARS',
  CL: 'CLP', CO: 'COP', PE: 'PEN',
  // ── Middle East & Africa ──
  AE: 'AED', SA: 'SAR', IL: 'ILS', ZA: 'ZAR', EG: 'EGP',
  NG: 'NGN', KE: 'KES', MA: 'MAD',
};

/** Maps an ISO 3166-1 alpha-2 country code to its display currency.
 *  Returns null when the country has no currency (e.g. Antarctica) or the
 *  code is unsupported — callers then render plain grouped numerals. */
export function currencyFromLocation(
  country: string | null | undefined,
): CurrencyCode | null {
  if (!country) return null;
  const code = country.trim().toUpperCase();
  return COUNTRY_TO_CURRENCY[code] ?? null;
}

const LOCALE_TAG: Record<'th' | 'en', string> = {
  th: 'th-TH',
  en: 'en-US',
};

/**
 * Format a money amount for display.
 * Passing `currency: null` yields plain grouped numerals with NO symbol
 * (the "no currency resolved" case).
 */
export function formatMoney(
  amount: number,
  currency: CurrencyCode | null,
  locale: 'th' | 'en' = 'en',
): string {
  if (currency === null) {
    return new Intl.NumberFormat(LOCALE_TAG[locale], {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat(LOCALE_TAG[locale], {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Legacy helper kept for non-React callers and tests.
 * Currency is derived from locale unless an explicit `currency` is passed.
 */
export function formatCurrency(
  amount: number,
  locale: 'th' | 'en' = 'en',
  currency?: CurrencyCode | null,
): string {
  const resolved =
    currency === undefined ? (locale === 'th' ? 'THB' : 'USD') : currency;
  return formatMoney(amount, resolved, locale);
}

export function parseCurrency(value: string): number {
  return Number(value.replace(/[^0-9.-]/g, '')) || 0;
}
