import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ThemeProvider } from '@/components/providers/theme-provider';

// Mutable so tests can simulate location-on / location-off (hoisted above vi.mock)
type ResolvedLoc = { location: { lat: number; lon: number } | null; country: string | null };
const mockResolvedLocation = vi.hoisted(() =>
  vi.fn<() => ResolvedLoc>(() => ({ location: { lat: -33.9249, lon: 18.4241 }, country: 'ZA' })),
);

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@/hooks/use-local-db', () => ({
  useWizardProfile: () => ({ profile: null, loading: false }),
  useBudgets: () => ({ budgets: [], loading: false, save: vi.fn(), get: vi.fn() }),
  useBills: () => ({ bills: [], loading: false, add: vi.fn(), update: vi.fn(), remove: vi.fn() }),
  useExpenses: () => ({ expenses: [], loading: false, add: vi.fn(), remove: vi.fn(), update: vi.fn() }),
}));

vi.mock('@/hooks/use-critical-expense', () => ({
  useCriticalExpense: () => ({ commitment: null, loading: false }),
}));

vi.mock('@/hooks/use-resolved-location', () => ({
  useResolvedLocation: () => mockResolvedLocation(),
}));

vi.mock('@/components/ui/sync-status-indicator', () => ({
  SyncStatusIndicator: () => <div data-testid="sync-status-indicator" />,
}));

vi.mock('lottie-react', () => ({
  __esModule: true,
  default: ({ animationData, ...props }: { animationData?: unknown; [key: string]: unknown }) => {
    void animationData;
    return <div data-testid="lottie-animation" {...props} />;
  },
  Lottie: ({ animationData, ...props }: { animationData?: unknown; [key: string]: unknown }) => {
    void animationData;
    return <div data-testid="lottie-animation" {...props} />;
  },
  LottiePlayer: () => null,
  useLottie: () => null,
  useLottieInteractivity: () => null,
}));

// Mock convex/react so the shell test isolates panel switching, not the
// receipts data layer (ReceiptDraftsList is rendered inside the shell).
vi.mock('convex/react', () => ({
  useQuery: () => undefined,
  useMutation: () => vi.fn(),
}));

// ReceiptDraftsList imports addExpense; stub it so it no-ops in the shell test.
vi.mock('@/lib/db/stores/expenses-store', () => ({
  addExpense: vi.fn(),
}));

// The AccountSwitcher child uses useAccounts (Convex); mock it so the shell
// test only exercises panel switching, not the accounts data layer.
vi.mock('@/hooks/use-accounts', () => ({
  useAccounts: () => ({
    accounts: [
      { accountId: 'personal', umbrella: 'personal', name: 'Personal', boardId: null, inviteCode: null, role: 'owner', hasLocalData: true, memberCount: 1 },
    ],
    currentAccountId: 'personal',
    loading: false,
    ready: true,
    switchTo: vi.fn(),
    refresh: vi.fn(),
    createAccount: vi.fn(),
    createInviteToken: vi.fn(),
    acceptInvite: vi.fn(),
    declineInvite: vi.fn(),
    leaveAccount: vi.fn(),
    removeMember: vi.fn(),
    renameAccount: vi.fn(),
  }),
}));

// Mock panel modules so the test only exercises the shell's mobile panel switching,
// not the panels' internal data hooks. Factories must be self-contained (vi.mock is hoisted).
vi.mock('@/components/dashboard/panels/spending-panel', () => ({
  SpendingPanel: () => {
    return React.createElement('div', null, 'Spending');
  }
}));
vi.mock('@/components/dashboard/panels/savings-goals', () => ({
  SavingsGoals: () => {
    return React.createElement('div', null, 'Goals');
  }
}));
vi.mock('@/components/dashboard/panels/net-worth', () => ({
  NetWorth: () => {
    return React.createElement('div', null, 'Net Worth');
  }
}));
vi.mock('@/components/dashboard/panels/budget-alerts', () => ({
  BudgetAlerts: () => {
    return React.createElement('div', null, 'Budget Alerts');
  }
}));
vi.mock('@/components/dashboard/panels/income-inflow-panel', () => ({
  IncomeInflowPanel: () => {
    return React.createElement('div', null, 'Income Inflow');
  }
}));

import { DashboardShell } from './dashboard-shell'
import React from 'react'

const mockMatchMedia = vi.fn().mockReturnValue({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
})

beforeAll(() => {
  vi.stubGlobal('matchMedia', mockMatchMedia)
})

const renderShell = (props: Partial<React.ComponentProps<typeof DashboardShell>> = {}) =>
  render(
    <ThemeProvider>
      <DashboardShell locale="en" {...props} />
    </ThemeProvider>,
  )

// The panel card title is an <h3> with the panel name; the mocked body also renders the
// same label. Scope to the card title to assert which single panel is shown.
const cardTitle = (card: HTMLElement) => within(card).getByRole('heading', { level: 3 }).textContent

describe('DashboardShell (mobile)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  })

  it('renders exactly one panel card in the mobile region by default (spending)', () => {
    renderShell()
    const mobileRegion = screen.getByTestId('mobile-panels')
    const cards = within(mobileRegion).getAllByTestId('panel-card')
    expect(cards).toHaveLength(1)
    expect(cardTitle(cards[0])).toMatch(/spending/i)
  })

  it('swaps the single rendered mobile panel when a bottom tab is clicked', () => {
    renderShell()
    const mobileRegion = screen.getByTestId('mobile-panels')
    expect(within(mobileRegion).getAllByTestId('panel-card')).toHaveLength(1)
    expect(cardTitle(within(mobileRegion).getByTestId('panel-card'))).toMatch(/spending/i)

    fireEvent.click(screen.getByTestId('mobile-tab-goals'))

    const cards = within(mobileRegion).getAllByTestId('panel-card')
    expect(cards).toHaveLength(1)
    expect(cardTitle(cards[0])).toMatch(/goals/i)
  })

  it('mobile bottom sheet lists all panels including Cut One Expense', () => {
    renderShell();
    const sheet = screen.getByTestId('mobile-sheet');
    // Cut One Expense lives in the mobile sheet (primary mobile access point).
    expect(within(sheet).getByRole('button', { name: /pick one expense to cut this month/i })).toBeInTheDocument();
    // All 11 panels are reachable from the sheet, plus the account switcher.
    // 15 = close(X) + Cut One + Market Watch + AccountSwitcher + 11 panels.
    expect(within(sheet).getAllByRole('button')).toHaveLength(15);
  });

  it('does not render the floating FAB', () => {
    renderShell();
    expect(screen.queryByRole('button', { name: /open menu/i })).toBeNull();
  });

  it('Market Watch modal renders with a title header', () => {
    renderShell();
    const triggers = screen.getAllByRole('button', { name: /market watch/i });
    fireEvent.click(triggers[0]);
    // The modal heading has id="modal-title" - query by role heading with level 2 within dialog
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('Critical Expenses modal body is scrollable (overflow-y-auto)', () => {
    renderShell();
    const triggers = screen.getAllByRole('button', { name: /pick one expense to cut this month/i });
    fireEvent.click(triggers[0]);
    // The scrollable modal body wraps the "Pick one expense to cut" content.
    const dialog = screen.getByRole('dialog');
    expect(dialog.querySelector('.overflow-y-auto')).not.toBeNull();
    expect(dialog.className).toContain('max-h-[85vh]');
  });
});

describe('DashboardShell — Market Watch location gating', () => {
  it('renders Enable Location button (no trigger) when location is unavailable', () => {
    mockResolvedLocation.mockReturnValue({ location: null, country: null });
    renderShell();
    expect(screen.getAllByTestId('market-watch-location-locked')).toHaveLength(2);
    expect(screen.queryByTestId('market-watch-trigger')).toBeNull();
  });

  it('renders Market Watch trigger when location is available', () => {
    mockResolvedLocation.mockReturnValue({ location: { lat: -33.9249, lon: 18.4241 }, country: 'ZA' });
    renderShell();
    expect(screen.getAllByTestId('market-watch-trigger')).toHaveLength(2);
    expect(screen.queryByTestId('market-watch-location-locked')).toBeNull();
  });
});