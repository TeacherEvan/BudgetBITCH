// hooks/use-shimmer-pref.ts
'use client';

import { useEffect, useState, useCallback } from 'react';

const SHIMMER_KEY = 'bb:shimmerEnabled';

/**
 * Controls the global shimmer/sheen animation. When disabled, a class is added
 * to <html> that suppresses the animated gold edge glow (see globals.css).
 * Defaults to ON. Honors prefers-reduced-motion automatically.
 */
export function useShimmerPref() {
  const [enabled, setEnabledState] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let initial = true;
    try {
      const stored = localStorage.getItem(SHIMMER_KEY);
      if (stored !== null) {
        initial = stored === '1';
      } else if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        initial = false;
      }
    } catch {
      /* ignore */
    }
    setEnabledState(initial);
    apply(initial);
  }, []);

  const apply = (on: boolean) => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('bb-shimmer-off', !on);
  };

  const setEnabled = useCallback((on: boolean) => {
    setEnabledState(on);
    apply(on);
    try {
      localStorage.setItem(SHIMMER_KEY, on ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);

  return { enabled, setEnabled };
}
