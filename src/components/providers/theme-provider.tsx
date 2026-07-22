'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';

type Theme = 'amber' | 'dark' | 'gold';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, defaultTheme = 'amber' }: { children: ReactNode; defaultTheme?: Theme }) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<Theme>(defaultTheme);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    const stored = localStorage.getItem('budgetbitch:theme') as Theme | null;
    let initial = defaultTheme;
    if (stored) {
      initial = stored;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(stored);
    } else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      initial = 'dark';
      setTheme('dark');
    }
    
    // Always apply the theme class to the root element on mount
    const root = document.documentElement;
    root.classList.remove('theme-amber', 'theme-dark', 'theme-gold');
    root.classList.add(`theme-${initial}`);
  }, [defaultTheme]);

  useEffect(() => {
    if (!mountedRef.current) return;
    const root = document.documentElement;
    root.classList.remove('theme-amber', 'theme-dark', 'theme-gold');
    root.classList.add(`theme-${theme}`);
    localStorage.setItem('budgetbitch:theme', theme);
    setResolvedTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!mountedRef.current) return;
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mediaQuery) return;
    const handler = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem('budgetbitch:theme');
      if (!stored) {
        setResolvedTheme(e.matches ? 'dark' : 'amber');
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}