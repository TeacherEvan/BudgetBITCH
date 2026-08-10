// hooks/use-currency-override.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CurrencyCode } from '@/lib/utils/currency';
import { getSettings, saveSettings } from '@/lib/db/local-db';

const OVERRIDE_KEY = 'bb:currencyOverride';

export type CurrencyOverride = CurrencyCode | null;

export function useCurrencyOverride() {
  const [override, setOverrideState] = useState<CurrencyOverride>(null);

  // Hydrate after mount from localStorage and IndexedDB settings store
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;

    const loadCurrency = async () => {
      try {
        const stored = localStorage.getItem(OVERRIDE_KEY);
        if (stored) {
          if (!cancelled) setOverrideState(stored as CurrencyCode);
          return;
        }

        const settings = await getSettings();
        if (settings && (settings as unknown as { preferredCurrency?: CurrencyCode }).preferredCurrency) {
          const curr = (settings as unknown as { preferredCurrency?: CurrencyCode }).preferredCurrency!;
          localStorage.setItem(OVERRIDE_KEY, curr);
          if (!cancelled) setOverrideState(curr);
        }
      } catch {
        /* ignore storage read error */
      }
    };

    void loadCurrency();

    const onCurrencyChanged = () => {
      try {
        const stored = localStorage.getItem(OVERRIDE_KEY);
        setOverrideState(stored ? (stored as CurrencyCode) : null);
      } catch {
        /* ignore */
      }
    };

    window.addEventListener('budgetbitch:currencyChanged', onCurrencyChanged);
    return () => {
      cancelled = true;
      window.removeEventListener('budgetbitch:currencyChanged', onCurrencyChanged);
    };
  }, []);

  const setOverride = useCallback((code: CurrencyOverride) => {
    setOverrideState(code);
    try {
      if (code === null) {
        localStorage.removeItem(OVERRIDE_KEY);
      } else {
        localStorage.setItem(OVERRIDE_KEY, code);
      }
      window.dispatchEvent(new Event('budgetbitch:currencyChanged'));

      void (async () => {
        try {
          const currentSettings = (await getSettings()) || {
            preferredLocale: 'en',
            voiceSettings: { enabled: false, rate: 1, pitch: 1 },
            privacyDisclaimerAccepted: true,
          };
          await saveSettings({
            ...currentSettings,
            preferredCurrency: code,
          } as never);
        } catch {
          /* non-fatal DB write error */
        }
      })();
    } catch {
      /* ignore */
    }
  }, []);

  return { override, setOverride } as const;
}
