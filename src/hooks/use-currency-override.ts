// hooks/use-currency-override.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CurrencyCode } from '@/lib/utils/currency';

/**
 * User-facing currency override.
 *
 * `null` = AUTO: let the resolved location pick the currency
 * (see `useResolvedCurrency`). Any explicit code beats the location so a
 * user who declined location, or who lives where auto-detect is wrong, can
 * pin their symbol. Persisted in localStorage so it survives reloads.
 *
 * This keeps BudgetBITCH free/local-first: no paid currency connectors,
 * no bank aggregation — just a manual picker like top budgeting apps.
 */
const OVERRIDE_KEY = 'bb:currencyOverride';

export type CurrencyOverride = CurrencyCode | null;

export function useCurrencyOverride() {
  const [override, setOverrideState] = useState<CurrencyOverride>(null);

  // Hydrate after mount only — avoids SSR/hydration mismatch.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(OVERRIDE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOverrideState(stored ? (stored as CurrencyCode) : null);
    } catch {
      /* ignore */
    }
  }, []);

  const setOverride = useCallback((code: CurrencyOverride) => {
    setOverrideState(code);
    try {
      if (code === null) localStorage.removeItem(OVERRIDE_KEY);
      else localStorage.setItem(OVERRIDE_KEY, code);
    } catch {
      /* ignore */
    }
  }, []);

  return { override, setOverride } as const;
}
