// src/app/settings/page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/components/providers/theme-provider';

// Mock the hooks used in SettingsPage
vi.mock('@convex-dev/auth/react', () => ({
  useConvexAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/use-local-db', () => ({
  useWizardProfile: () => ({
    clear: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-voice', () => ({
  useVoice: () => ({
    settings: { enabled: false, rate: 1, pitch: 1 },
    updateSettings: vi.fn(),
    toggleVoice: vi.fn(),
    isSupported: true,
  }),
}));

vi.mock('@/hooks/use-critical-expense', () => ({
  useCriticalExpense: () => ({
    commitment: null,
  }),
}));

import SettingsPage from './page';

const renderWithProviders = (component: React.ReactNode) => render(<ThemeProvider>{component}</ThemeProvider>);

describe('SettingsPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('loads theme from localStorage on mount without cascading renders', () => {
    localStorage.setItem('budgetbitch:theme', 'dark');
    
    const { container } = renderWithProviders(<SettingsPage locale="en" />);
    
    // Theme should be applied to documentElement immediately
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    expect(document.documentElement.classList.contains('theme-amber')).toBe(false);
  });

  it('loads lastSync from localStorage on mount', async () => {
    const timestamp = '2026-06-13T10:00:00.000Z';
    localStorage.setItem('budgetbitch:lastSync', timestamp);
    
    renderWithProviders(<SettingsPage locale="en" />);
    
    // Wait for the date element to appear (format: MMM d, yyyy HH:mm)
    const dateElement = await screen.findByText(/\w{3} \s*\d{1,2}, \s*\d{4}/);
    expect(dateElement).toBeInTheDocument();
    expect(screen.queryByText(/Never synced/i)).not.toBeInTheDocument();
  });
  
  it('renders ThemeToggle component', () => {
    renderWithProviders(<SettingsPage locale="en" />);
    expect(screen.getByRole('radio', { name: /amber/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /dark/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /gold/i })).toBeInTheDocument();
  });
});