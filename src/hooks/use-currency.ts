// hooks/use-currency.ts
'use client';

import { useState, useEffect } from 'react';
import { getLocationCache } from '@/lib/db/local-db';
import {
  currencyFromLocation,
  formatMoney,
  type CurrencyCode,
} from '@/lib/utils/currency';

/**
 * Resolves the display currency from the user's stored location country.
 * Returns null until the cache is read (SSR-safe) and null when no country
 * was accepted/resolved — meaning "no currency symbol, numerals only".
 */
export function useResolvedCurrency(): CurrencyCode | null {
  const [currency, setCurrency] = useState<CurrencyCode | null>(null);

  useEffect(() => {
    let mounted = true;
    getLocationCache()
      .then((cache) => {
        if (mounted) setCurrency(currencyFromLocation(cache?.country ?? null));
      })
      .catch(() => {
        if (mounted) setCurrency(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return currency;
}

/**
 * Returns a currency formatter with the SAME signature as the old
 * `formatCurrency(amount, locale)` so existing call sites need only swap
 * the import for `const formatCurrency = useCurrency();`.
 *
 * When the location is unresolved, amounts render as plain grouped numerals
 * (no symbol).
 */
export function useCurrency(): (amount: number, locale?: 'th' | 'en') => string {
  const currency = useResolvedCurrency();
  return (amount: number, locale: 'th' | 'en' = 'en') =>
    formatMoney(amount, currency, locale);
}
