import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, useTheme } from './theme-provider';

const mockMatchMedia = vi.fn().mockReturnValue({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});

beforeAll(() => {
  vi.stubGlobal('matchMedia', mockMatchMedia);
});

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it('applies theme class to documentElement on mount', () => {
    render(<ThemeProvider><div>Children</div></ThemeProvider>);
    expect(document.documentElement.classList.contains('theme-amber')).toBe(true);
  });

  it('respects localStorage theme preference', () => {
    localStorage.setItem('budgetbitch:theme', 'dark');
    render(<ThemeProvider><div>Children</div></ThemeProvider>);
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
  });

  it('exposes setTheme function to children', () => {
    let setThemeFn: ((theme: 'amber' | 'dark' | 'gold') => void) | null = null;
    const TestChild = () => {
      const { setTheme } = useTheme();
      setThemeFn = setTheme;
      return <div data-testid="child">Child</div>;
    };
    render(<ThemeProvider><TestChild /></ThemeProvider>);
    expect(typeof setThemeFn).toBe('function');
  });
});