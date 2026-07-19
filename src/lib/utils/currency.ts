// lib/utils/currency.ts

export type CurrencyCode = 'THB' | 'USD';

/** Maps a resolved geolocation country to a display currency. */
export function currencyFromLocation(country: string | null | undefined): CurrencyCode | null {
  switch (country) {
    case 'TH':
      return 'THB';
    case 'US':
      return 'USD';
    default:
      return null; // OTHER, unsupported, or no resolved country -> no symbol
  }
}

const LOCALE_TAG: Record<'th' | 'en', string> = {
  th: 'th-TH',
  en: 'en-US',
};

/**
 * Format a money amount for display.
 * Passing `currency: null` yields plain grouped numerals with NO symbol
 * (the "location not accepted" case).
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
  const resolved = currency === undefined ? (locale === 'th' ? 'THB' : 'USD') : currency;
  return formatMoney(amount, resolved, locale);
}

export function parseCurrency(value: string): number {
  return Number(value.replace(/[^0-9.-]/g, '')) || 0;
}
