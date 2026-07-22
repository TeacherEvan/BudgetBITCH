// src/app/settings/page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@/components/providers/theme-provider';

// Mock i18n (useLocale + useTranslations) and router for the LocaleSwitcher
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}));

const mockRouter = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('convex/react', () => ({
  useMutation: () => vi.fn().mockResolvedValue({ success: true }),
  useAction: () => vi.fn().mockResolvedValue({ success: true }),
  useQuery: () => null,
}));

// Mock the hooks used in SettingsPage
vi.mock('@convex-dev/auth/react', () => ({
  useConvexAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
  }),
  useAuthActions: () => ({
    signOut: vi.fn().mockResolvedValue(undefined),
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

type SharedState = {
  myProfile: { shareCode: string | null; displayName: string | null; linkedBoardId: string | null };
  partnerName: string | null;
  isLinked: boolean;
  boardId: string | null;
  lastSyncedAt: number | null;
  linkByCode: ReturnType<typeof vi.fn>;
  unlink: ReturnType<typeof vi.fn>;
  resolving: boolean;
};

const sharedState = vi.hoisted<{ state: SharedState }>(() => ({
  state: {
    myProfile: { shareCode: 'ABCD1234', displayName: null, linkedBoardId: null },
    partnerName: null,
    isLinked: false,
    boardId: null,
    lastSyncedAt: null,
    linkByCode: vi.fn(async () => ({ ok: true as const })),
    unlink: vi.fn(async () => undefined),
    resolving: false,
  },
}));

vi.mock('@/hooks/use-shared-board', () => ({
  useSharedBoard: () => sharedState.state,
}));

import SettingsPage from './page';

const renderWithProviders = (component: React.ReactNode) =>
  render(<ThemeProvider>{component}</ThemeProvider>);

describe('SettingsPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    sharedState.state = {
      myProfile: { shareCode: 'ABCD1234', displayName: null, linkedBoardId: null },
      partnerName: null,
      isLinked: false,
      boardId: null,
      lastSyncedAt: null,
      linkByCode: vi.fn(async () => ({ ok: true as const })),
      unlink: vi.fn(async () => undefined),
      resolving: false,
    };
  });

  it('loads theme from localStorage on mount without cascading renders', () => {
    localStorage.setItem('budgetbitch:theme', 'dark');

    renderWithProviders(<SettingsPage />);

    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    expect(document.documentElement.classList.contains('theme-amber')).toBe(false);
  });

  it('loads lastSync from localStorage on mount', async () => {
    const timestamp = '2026-06-13T10:00:00.000Z';
    localStorage.setItem('budgetbitch:lastSync', timestamp);

    renderWithProviders(<SettingsPage />);

    const dateElement = await screen.findByText(/\w{3} \s*\d{1,2}, \s*\d{4}/);
    expect(dateElement).toBeInTheDocument();
    expect(screen.queryByText(/Never synced/i)).not.toBeInTheDocument();
  });

  it('renders ThemeToggle component', () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByRole('radio', { name: /amber/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /dark/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /gold/i })).toBeInTheDocument();
  });

  it('renders the app-wide LocaleSwitcher (not a custom locale Select)', () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('opens a confirm modal for reset instead of window.confirm', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    renderWithProviders(<SettingsPage />);

    fireEvent.click(screen.getByRole('button', { name: /reset all data/i }));

    // Modal appears with the confirm title
    expect(screen.getByText(/confirm reset/i)).toBeInTheDocument();
    // window.confirm was never used
    expect(confirmSpy).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('renders the Shared Board section with the user share code', () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByRole('heading', { name: /shared board/i })).toBeInTheDocument();
    expect(screen.getByText('ABCD1234')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /link/i })).toBeInTheDocument();
  });

  it('shows linked state and unlink button when connected', () => {
    sharedState.state = {
      ...sharedState.state,
      myProfile: { shareCode: 'ABCD1234', displayName: null, linkedBoardId: 'board_xyz' },
      isLinked: true,
      boardId: 'board_xyz',
    };

    renderWithProviders(<SettingsPage />);
    expect(screen.getByText(/linked with your partner/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /unlink/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^link$/i })).not.toBeInTheDocument();
  });

  it('calls linkByCode with the entered code', async () => {
    const linkByCode = vi.fn(async () => ({ ok: true as const }));
    sharedState.state = { ...sharedState.state, linkByCode };

    renderWithProviders(<SettingsPage />);
    const input = screen.getByLabelText(/link with code/i);
    fireEvent.change(input, { target: { value: ' partner99 ' } });
    fireEvent.click(screen.getByRole('button', { name: /^link$/i }));

    await waitFor(() => expect(linkByCode).toHaveBeenCalledWith(' partner99 '));
  });

  it('shows an error when linking fails', async () => {
    sharedState.state = {
      ...sharedState.state,
      linkByCode: vi.fn(async () => ({ ok: false as const, error: 'Share code not found' })),
    };

    renderWithProviders(<SettingsPage />);
    const input = screen.getByLabelText(/link with code/i);
    fireEvent.change(input, { target: { value: 'badcode' } });
    fireEvent.click(screen.getByRole('button', { name: /^link$/i }));

    expect(await screen.findByText(/share code not found/i)).toBeInTheDocument();
  });

  it('navigates to /dashboard via router (no full reload) when re-running the wizard', () => {
    renderWithProviders(<SettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: /re-run setup wizard/i }));
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    expect(window.location.pathname).not.toBe('/dashboard');
  });

  it('exposes a labelled section nav with one tab per rendered section', () => {
    const { container } = renderWithProviders(<SettingsPage />);
    const nav = screen.getByRole('navigation', { name: /settings sections/i });
    expect(nav).toBeInTheDocument();

    // Every section anchor id must be present in the DOM and referenced by a tab.
    const expectedIds = [
      'settings-general',
      'settings-profile',
      'settings-display',
      'settings-news',
      'settings-preferences',
      'settings-data',
      'settings-shared',
      'settings-privacy',
    ];
    for (const id of expectedIds) {
      const section = container.querySelector(`#${id}`);
      expect(section).not.toBeNull();
      const tab = nav.querySelector(`a[href="#${id}"]`);
      expect(tab).not.toBeNull();
    }
  });

  it('exposes a password management entry point in the privacy section', () => {
    renderWithProviders(<SettingsPage />);

    expect(screen.getByText(/change password/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/change password/i));
    expect(screen.getByText('Current Password')).toBeInTheDocument();
  });
});
