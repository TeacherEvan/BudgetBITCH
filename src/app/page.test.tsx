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

// Mock components
vi.mock('@/components/onboarding/language-select-modal', () => ({
  LanguageSelectModal: ({ isOpen, onComplete }: any) => 
    isOpen ? (
      <div data-testid="language-modal" role="dialog">
        <button onClick={() => onComplete('th')}>ไทย</button>
        <button onClick={() => onComplete('en')}>English</button>
      </div>
    ) : null,
}));

vi.mock('@/components/auth/clean-auth-card', () => ({
  CleanAuthCard: ({ initialFlow }: any) => (
    <div data-testid="clean-auth-card">
      <span>{initialFlow === 'signIn' ? 'Sign In' : 'Sign Up'}</span>
    </div>
  ),
}));

vi.mock('@/components/pwa/install-prompt', () => ({
  PWAInstallPrompt: () => <div data-testid="pwa-prompt" />,
}));

vi.mock('@/lib/url', () => ({
  normalizeConvexCloudUrl: () => 'https://convex.cloud',
}));

const renderWithProviders = (component: React.ReactNode) => 
  render(<ThemeProvider>{component}</ThemeProvider>);

describe('Landing Page Redirect Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockClear();
  });

  describe('Language Select Modal', () => {
    it('shows language select modal when no locale stored', () => {
      renderWithProviders(<Home />);
      
      expect(screen.getByTestId('language-modal')).toBeInTheDocument();
      expect(screen.queryByTestId('welcome-window')).not.toBeInTheDocument();
    });

    it('saves locale to localStorage when Thai selected', () => {
      renderWithProviders(<Home />);
      
      const modal = screen.getByTestId('language-modal');
      const thaiButton = modal.querySelector('button');
      if (thaiButton) {
        act(() => {
          thaiButton.click();
        });
      }
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('budgetbitch:locale', 'th');
    });

    it('saves locale to localStorage when English selected', () => {
      renderWithProviders(<Home />);
      
      const modal = screen.getByTestId('language-modal');
      const buttons = modal.querySelectorAll('button');
      if (buttons[1]) {
        act(() => {
          buttons[1].click();
        });
      }
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('budgetbitch:locale', 'en');
    });
  });

  describe('Welcome Window (after locale selected)', () => {
    it('shows welcome window when locale is set but not authenticated', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'budgetbitch:locale') return 'en';
        if (key === 'budgetbitch:wizard-complete') return 'false';
        return null;
      });
      
      renderWithProviders(<Home />);
      
      expect(screen.getByTestId('clean-auth-card')).toBeInTheDocument();
      expect(screen.queryByTestId('language-modal')).not.toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('shows welcome window in Thai when locale is th', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'budgetbitch:locale') return 'th';
        if (key === 'budgetbitch:wizard-complete') return 'false';
        return null;
      });
      
      renderWithProviders(<Home />);
      
      expect(screen.getByTestId('clean-auth-card')).toBeInTheDocument();
    });
  });
});