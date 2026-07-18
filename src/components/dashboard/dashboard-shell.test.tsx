import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ThemeProvider } from '@/components/providers/theme-provider';

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/hooks/use-local-db', () => ({
  useWizardProfile: () => ({ profile: null, loading: false }),
}));

vi.mock('@/hooks/use-critical-expense', () => ({
  useCriticalExpense: () => ({ commitment: null, loading: false }),
}));

vi.mock('@/hooks/use-voice', () => ({
  useVoice: () => ({
    settings: { enabled: false },
    toggleVoice: vi.fn(),
    speak: vi.fn(),
  }),
}));

// Mock panel modules so the test only exercises the shell's mobile panel switching,
// not the panels' internal data hooks. Factories must be self-contained (vi.mock is hoisted).
vi.mock('@/components/dashboard/panels/expense-tracker', () => ({
  ExpenseTracker: () => {
    const React = require('react');
    return React.createElement('div', null, 'Expenses');
  },
}));
vi.mock('@/components/dashboard/panels/budget-visual', () => ({
  BudgetVisual: () => {
    const React = require('react');
    return React.createElement('div', null, 'Budget');
  },
}));
vi.mock('@/components/dashboard/panels/savings-goals', () => ({
  SavingsGoals: () => {
    const React = require('react');
    return React.createElement('div', null, 'Goals');
  },
}));
vi.mock('@/components/dashboard/panels/net-worth', () => ({
  NetWorth: () => {
    const React = require('react');
    return React.createElement('div', null, 'Net Worth');
  },
}));
vi.mock('@/components/dashboard/panels/budget-alerts', () => ({
  BudgetAlerts: () => {
    const React = require('react');
    return React.createElement('div', null, 'Budget Alerts');
  },
}));

import { DashboardShell } from './dashboard-shell';

const mockMatchMedia = vi.fn().mockReturnValue({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});

beforeAll(() => {
  vi.stubGlobal('matchMedia', mockMatchMedia);
});

const renderShell = (props: Partial<React.ComponentProps<typeof DashboardShell>> = {}) =>
  render(
    <ThemeProvider>
      <DashboardShell locale="en" {...props} />
    </ThemeProvider>,
  );

// The panel card title is an <h3> with the panel name; the mocked body also renders the
// same label. Scope to the card title to assert which single panel is shown.
const cardTitle = (card: HTMLElement) => within(card).getByRole('heading', { level: 3 }).textContent;

describe('DashboardShell (mobile)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it('renders exactly one panel card in the mobile region by default (expenses)', () => {
    renderShell();
    const mobileRegion = screen.getByTestId('mobile-panels');
    const cards = within(mobileRegion).getAllByTestId('panel-card');
    expect(cards).toHaveLength(1);
    expect(cardTitle(cards[0])).toMatch(/expenses/i);
  });

  it('swaps the single rendered mobile panel when a bottom tab is clicked', () => {
    renderShell();
    const mobileRegion = screen.getByTestId('mobile-panels');
    expect(within(mobileRegion).getAllByTestId('panel-card')).toHaveLength(1);
    expect(cardTitle(within(mobileRegion).getByTestId('panel-card'))).toMatch(/expenses/i);

    fireEvent.click(screen.getByTestId('mobile-tab-goals'));

    const cards = within(mobileRegion).getAllByTestId('panel-card');
    expect(cards).toHaveLength(1);
    expect(cardTitle(cards[0])).toMatch(/goals/i);
  });

  it('mobile bottom sheet lists all panels including Cut One Expense', () => {
    renderShell();
    const sheet = screen.getByTestId('mobile-sheet');
    // Cut One Expense lives in the mobile sheet (primary mobile access point).
    expect(within(sheet).getByRole('button', { name: /pick 1 to cut this month/i })).toBeInTheDocument();
    // All 10 panels are reachable from the sheet.
    // 13 = close(X) + Cut One + Market Watch + 10 panels.
    expect(within(sheet).getAllByRole('button')).toHaveLength(13);
  });

  it('does not render the floating FAB', () => {
    renderShell();
    expect(screen.queryByRole('button', { name: /open menu/i })).toBeNull();
  });
});
