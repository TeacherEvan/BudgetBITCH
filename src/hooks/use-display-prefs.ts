// hooks/use-display-prefs.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

export type GraphType = 'bar' | 'donut' | 'pie' | 'line';
export type AccentColor = 'gold' | 'amber' | 'emerald';

const GRAPH_TYPE_KEY = 'bb:graphType';
const ACCENT_COLOR_KEY = 'bb:accentColor';

const DEFAULTS = {
  graphType: 'bar' as GraphType,
  accentColor: 'gold' as AccentColor,
};

function readStorage<T extends string>(key: string, defaultValue: T, allowed: readonly T[]): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    if (stored && (allowed as readonly string[]).includes(stored)) return stored as T;
  } catch { /* ignore */ }
  return defaultValue;
}

export function useDisplayPrefs() {
  const [graphType, setGraphTypeState] = useState<GraphType>(DEFAULTS.graphType);
  const [accentColor, setAccentColorState] = useState<AccentColor>(DEFAULTS.accentColor);

  // Hydrate from localStorage after mount — post-mount only, avoids SSR mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGraphTypeState(readStorage(GRAPH_TYPE_KEY, DEFAULTS.graphType, ['bar', 'donut', 'pie', 'line'] as const));
    setAccentColorState(readStorage(ACCENT_COLOR_KEY, DEFAULTS.accentColor, ['gold', 'amber', 'emerald'] as const));
  }, []);

  const setGraphType = useCallback((type: GraphType) => {
    setGraphTypeState(type);
    try { localStorage.setItem(GRAPH_TYPE_KEY, type); } catch { /* ignore */ }
  }, []);

  const setAccentColor = useCallback((color: AccentColor) => {
    setAccentColorState(color);
    try { localStorage.setItem(ACCENT_COLOR_KEY, color); } catch { /* ignore */ }
    // Apply accent to document root immediately
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const map: Record<AccentColor, { base: string; bright: string; ink: string }> = {
        gold:    { base: '#C9960C', bright: '#E8B020', ink: '#080600' },
        amber:   { base: '#E8A020', bright: '#F5B020', ink: '#1a0f00' },
        emerald: { base: '#2DB870', bright: '#40C87A', ink: '#011a0c' },
      };
      const c = map[color];
      root.style.setProperty('--accent', c.base);
      root.style.setProperty('--accent-strong', c.bright);
      root.style.setProperty('--accent-ink', c.ink);
    }
  }, []);

  return { graphType, setGraphType, accentColor, setAccentColor };
}
