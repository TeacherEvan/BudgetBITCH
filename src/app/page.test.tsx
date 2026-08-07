// app/page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { render, screen, act } from '@testing-library/react';
import { ThemeProvider } from '@/components/providers/theme-provider';
import Home from './page';

// Mock Convex Auth
vi.mock('@convex-dev/auth/react', () => ({
  useConvexAuth: () => ({
    isLoading: false,
    isAuthenticated: false,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: mockLocalStorage,
});

// Mock sessionStorage so each test starts with a fresh splash state.
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  writable: true,
  value: mockSessionStorage,
});

vi.mock('@/components/launch/golden-splash', () => {
  return {
    GoldenSplash: ({ onProceed }: { onProceed: () => void }) => {
      return (
        <div data-testid="golden-splash">
          <button onClick={onProceed}>[ Click to Proceed ]</button>
        </div>
      );
    },
  };
});

vi.mock('@/components/onboarding/language-select-modal', () => ({
  LanguageSelectModal: ({ isOpen, onComplete }: { isOpen: boolean; onComplete: (selection: { locale: string; currency: string }) => void }) =>
    isOpen ? (
      <div data-testid="language-modal" role="dialog">
        <button onClick={() => onComplete({ locale: 'en', currency: 'USD' })}>United States</button>
        <button onClick={() => onComplete({ locale: 'fr', currency: 'EUR' })}>France</button>
        <button onClick={() => onComplete({ locale: 'zh', currency: 'CNY' })}>China</button>
      </div>
    ) : null,
}));

vi.mock('@/components/auth/clean-auth-card', () => ({
  CleanAuthCard: ({ initialFlow }: { initialFlow: string }) => (
    <div data-testid="clean-auth-card">
      <span>{initialFlow === 'signIn' ? 'Sign In' : 'Sign Up'}</span>
    </div>
  ),
}));

vi.mock('@/lib/url', () => ({
  normalizeConvexCloudUrl: () => 'https://convex.cloud',
}));

const renderWithProviders = (component: React.ReactNode) =>
  render(<ThemeProvider>{component}</ThemeProvider>);

describe('Landing Page Splash-First Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  it('shows the golden splash before the language modal or login card on first visit', async () => {
    mockSessionStorage.getItem.mockReturnValue(null);
    renderWithProviders(<Home />);
    expect(await screen.findByTestId('golden-splash')).toBeInTheDocument();
  });

  it('does not show the language modal beneath the splash on first visit', async () => {
    mockSessionStorage.getItem.mockReturnValue(null);
    renderWithProviders(<Home />);
    await screen.findByTestId('golden-splash');
    expect(screen.queryByTestId('language-modal')).not.toBeInTheDocument();
  });

  it('reveals the country flag language modal after the splash is dismissed on first run', async () => {
    mockSessionStorage.getItem.mockReturnValue(null);
    mockLocalStorage.getItem.mockReturnValue(null);
    renderWithProviders(<Home />);

    const proceed = await screen.findByText('[ Click to Proceed ]', {}, { timeout: 5000 });
    act(() => {
      proceed.click();
    });

    expect(screen.getByTestId('language-modal')).toBeInTheDocument();
  });

  it('skips the splash on subsequent visits and shows auth card if locale set', () => {
    mockSessionStorage.getItem.mockImplementation((key: string) =>
      key === 'bb:splash-seen' ? 'true' : null,
    );
    mockLocalStorage.getItem.mockImplementation((key: string) =>
      key === 'budgetbitch:locale' ? 'en' : null,
    );
    renderWithProviders(<Home />);
    expect(screen.queryByTestId('golden-splash')).not.toBeInTheDocument();
    expect(screen.getByTestId('clean-auth-card')).toBeInTheDocument();
  });

  it('shows the country flag language modal after splash when no locale stored', () => {
    mockSessionStorage.getItem.mockImplementation((key: string) =>
      key === 'bb:splash-seen' ? 'true' : null,
    );
    mockLocalStorage.getItem.mockReturnValue(null);
    renderWithProviders(<Home />);
    expect(screen.getByTestId('language-modal')).toBeInTheDocument();
  });

  it('saves locale to localStorage when United States selected and reveals auth card', () => {
    mockSessionStorage.getItem.mockImplementation((key: string) =>
      key === 'bb:splash-seen' ? 'true' : null,
    );
    mockLocalStorage.getItem.mockReturnValue(null);
    renderWithProviders(<Home />);

    const usButton = screen.getByRole('button', { name: 'United States' });
    act(() => {
      usButton.click();
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('budgetbitch:locale', 'en');
  });

  it('shows only auth card (no language modal) when locale is already set', () => {
    mockSessionStorage.getItem.mockImplementation((key: string) =>
      key === 'bb:splash-seen' ? 'true' : null,
    );
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === 'budgetbitch:locale') return 'en';
      return null;
    });

    renderWithProviders(<Home />);

    expect(screen.getByTestId('clean-auth-card')).toBeInTheDocument();
    expect(screen.queryByTestId('language-modal')).not.toBeInTheDocument();
  });
});
