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

const ACCENT_MAP: Record<AccentColor, { base: string; bright: string; ink: string }> = {
  gold:    { base: '#C9960C', bright: '#E8B020', ink: '#080600' },
  amber:   { base: '#E8A020', bright: '#F5B020', ink: '#1a0f00' },
  emerald: { base: '#2DB870', bright: '#40C87A', ink: '#011a0c' },
};

/** Write the accent CSS custom properties onto the document root. */
export function applyAccentToDocument(color: AccentColor): void {
  if (typeof document === 'undefined') return;
  const c = ACCENT_MAP[color];
  if (!c) return;
  const root = document.documentElement;
  root.style.setProperty('--accent', c.base);
  root.style.setProperty('--accent-strong', c.bright);
  root.style.setProperty('--accent-ink', c.ink);
}

export function useDisplayPrefs() {
  const [graphType, setGraphTypeState] = useState<GraphType>(DEFAULTS.graphType);
  const [accentColor, setAccentColorState] = useState<AccentColor>(DEFAULTS.accentColor);

  // Hydrate from localStorage after mount — post-mount only, avoids SSR mismatch.
  useEffect(() => {
    setGraphTypeState(readStorage(GRAPH_TYPE_KEY, DEFAULTS.graphType, ['bar', 'donut', 'pie', 'line'] as const));
    const storedAccent = readStorage(ACCENT_COLOR_KEY, DEFAULTS.accentColor, ['gold', 'amber', 'emerald'] as const);
    setAccentColorState(storedAccent);
    // Re-apply the saved accent to the document. Without this the swatch shows
    // as selected but the actual theme colour silently reverts to the default
    // on every page load, making the Accent Color buttons look broken.
    applyAccentToDocument(storedAccent);
  }, []);

  const setGraphType = useCallback((type: GraphType) => {
    setGraphTypeState(type);
    try { localStorage.setItem(GRAPH_TYPE_KEY, type); } catch { /* ignore */ }
  }, []);

  const setAccentColor = useCallback((color: AccentColor) => {
    setAccentColorState(color);
    try { localStorage.setItem(ACCENT_COLOR_KEY, color); } catch { /* ignore */ }
    applyAccentToDocument(color);
  }, []);

  return { graphType, setGraphType, accentColor, setAccentColor };
}
