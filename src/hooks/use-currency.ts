// hooks/use-currency.ts
'use client';

import { useState, useEffect } from 'react';
import { getLocationCache } from '@/lib/db/local-db';
import {
  currencyFromLocation,
  formatMoney,
  type CurrencyCode,
} from '@/lib/utils/currency';
import { useCurrencyOverride } from './use-currency-override';

/**
 * Resolves the display currency from the user's stored location country,
 * overridden by any explicit manual selection (Settings → Currency).
 * Returns null until resolved (SSR-safe) and null when no country was
 * accepted/resolved and no override is set — meaning "no currency symbol".
 */
export function useResolvedCurrency(): CurrencyCode | null {
  const [currency, setCurrency] = useState<CurrencyCode | null>(null);
  const { override } = useCurrencyOverride();

  useEffect(() => {
    let mounted = true;
    if (override) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrency(override);
      return;
    }
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
  }, [override]);

  return currency;
}

/**
 * Resolves the user's stored location country (TH / US / OTHER) from the
 * location cache. Returns null until the cache is read (SSR-safe) and null
 * when no country was accepted/resolved. Used to make Market Watch and other
 * surfaces location-aware.
 */
export function useResolvedCountry(): string | null {
  const [country, setCountry] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getLocationCache()
      .then((cache) => {
        if (mounted) setCountry(cache?.country ?? null);
      })
      .catch(() => {
        if (mounted) setCountry(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return country;
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
