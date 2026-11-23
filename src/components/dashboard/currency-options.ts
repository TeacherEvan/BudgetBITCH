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

// Static fallback rates (units of currency per 1 EUR), snapshot 2026-07-31.
// Used only when the live fetch fails so the converter degrades to a
// last-known rate instead of showing nothing. Every CurrencyCode is covered —
// receipt review can surface any display currency, not just the converter's
// select options, and a missing rate there made the FX badge a no-op.
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
  THB: 35.5,
  TWD: 35.2,
  MYR: 4.75,
  IDR: 17800,
  PHP: 66,
  VND: 28000,
  BDT: 122,
  PKR: 310,
  LKR: 330,
  NOK: 11.6,
  SEK: 11.1,
  DKK: 7.45,
  PLN: 4.3,
  CZK: 25.2,
  HUF: 400,
  RUB: 105,
  TRY: 47,
  UAH: 48,
  ARS: 1650,
  CLP: 1050,
  COP: 4400,
  PEN: 4.1,
  AED: 3.99,
  SAR: 4.07,
  ILS: 4.0,
  EGP: 58,
  NGN: 1750,
  KES: 140,
  MAD: 11,
};

export type ReceiptCurrencyConversion = {
  scannedCurrency: CurrencyCode;
  boardCurrency: CurrencyCode;
  /** Amount exactly as printed on the receipt. */
  originalAmount: number;
  /** Amount in the board currency; null when a rate is unavailable. */
  convertedAmount: number | null;
};

/**
 * Single source of truth for scanned-receipt FX. The review card renders this
 * result in its badge and the save path persists the same converted amount, so
 * what the user sees is exactly what lands in the ledger.
 *
 * Returns null when no conversion applies (missing currency, same currency,
 * or a non-positive amount).
 */
export function convertReceiptAmount(
  amount: number | string,
  scannedCurrency: string | null | undefined,
  boardCurrency: CurrencyCode | string | null | undefined,
): ReceiptCurrencyConversion | null {
  if (!scannedCurrency || !boardCurrency) return null;
  const normScanned = scannedCurrency.trim().toUpperCase() as CurrencyCode;
  const normBoard = String(boardCurrency).trim().toUpperCase() as CurrencyCode;
  if (normScanned === normBoard) return null;

  const parsedAmt = typeof amount === 'number' ? amount : parseFloat(amount);
  if (!Number.isFinite(parsedAmt) || parsedAmt <= 0) return null;

  const rateFrom = FALLBACK_RATES[normScanned];
  const rateTo = FALLBACK_RATES[normBoard];

  let convertedAmount: number | null = null;
  if (rateFrom && rateTo) {
    // Rates are EUR-relative.
    convertedAmount = Math.round((parsedAmt / rateFrom) * rateTo * 100) / 100;
  }

  return {
    scannedCurrency: normScanned,
    boardCurrency: normBoard,
    originalAmount: Math.round(parsedAmt * 100) / 100,
    convertedAmount,
  };
}
