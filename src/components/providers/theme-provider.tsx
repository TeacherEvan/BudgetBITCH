'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'amber' | 'dark' | 'gold';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(defaultTheme: Theme): Theme {
  if (typeof window === 'undefined') return defaultTheme;
  const stored = localStorage.getItem('budgetbitch:theme') as Theme | null;
  if (stored) return stored;
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
  return defaultTheme;
}

export function ThemeProvider({ children, defaultTheme = 'amber' }: { children: ReactNode; defaultTheme?: Theme }) {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme(defaultTheme));
  const [resolvedTheme, setResolvedTheme] = useState<Theme>(() => getInitialTheme(defaultTheme));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('budgetbitch:theme') as Theme | null;
    if (stored) {
      setTheme(stored);
      setResolvedTheme(stored);
    } else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      setResolvedTheme('dark');
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.remove('theme-amber', 'theme-dark', 'theme-gold');
    root.classList.add(`theme-${theme}`);
    localStorage.setItem('budgetbitch:theme', theme);
    setResolvedTheme(theme);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
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
  }, [mounted]);

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