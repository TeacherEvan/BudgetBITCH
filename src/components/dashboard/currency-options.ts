// components/dashboard/currency-options.ts
import type { CurrencyCode } from '@/lib/utils/currency';

export interface CurrencyOption {
  code: CurrencyCode;
  label: string;
}

// Covers the major free-floating currencies frankfurter.app publishes.
// No paid connectors — frankfurter is free EU Central Bank data.
export const CURRENCY_SELECT_OPTIONS: CurrencyOption[] = [
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'ZAR', label: 'ZAR — South African Rand' },
  { code: 'AUD', label: 'AUD — Australian Dollar' },
  { code: 'CAD', label: 'CAD — Canadian Dollar' },
  { code: 'CHF', label: 'CHF — Swiss Franc' },
  { code: 'JPY', label: 'JPY — Japanese Yen' },
  { code: 'CNY', label: 'CNY — Chinese Yuan' },
  { code: 'SGD', label: 'SGD — Singapore Dollar' },
  { code: 'HKD', label: 'HKD — Hong Kong Dollar' },
  { code: 'NZD', label: 'NZD — NZ Dollar' },
  { code: 'INR', label: 'INR — Indian Rupee' },
  { code: 'BRL', label: 'BRL — Brazilian Real' },
  { code: 'MXN', label: 'MXN — Mexican Peso' },
  { code: 'KRW', label: 'KRW — South Korean Won' },
];

// Static fallback rates (EUR-relative), snapshot 2026-07-31. Used only when the
// live fetch fails so the converter degrades to a last-known rate instead of
// showing nothing. Covers exactly the CURRENCY_SELECT_OPTIONS set above.
// Partial<> because CurrencyCode spans every supported display currency, not
// just the ones the converter offers — callers must handle a missing entry.
export const FALLBACK_RATES: Partial<Record<CurrencyCode, number>> = {
  EUR: 1,
  USD: 1.085,
  GBP: 0.852,
  ZAR: 19.84,
  AUD: 1.632,
  CAD: 1.471,
  CHF: 0.948,
  JPY: 168.4,
  CNY: 7.82,
  SGD: 1.454,
  HKD: 8.47,
  NZD: 1.783,
  INR: 90.6,
  BRL: 5.93,
  MXN: 19.62,
  KRW: 1472,
};
