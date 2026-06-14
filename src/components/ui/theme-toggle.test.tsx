import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from './theme-toggle';
import { ThemeProvider } from '@/components/providers/theme-provider';

const renderWithProvider = (component: React.ReactNode) => render(<ThemeProvider>{component}</ThemeProvider>);

const mockMatchMedia = vi.fn().mockReturnValue({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});

beforeAll(() => {
  vi.stubGlobal('matchMedia', mockMatchMedia);
});

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it('renders three theme options', () => {
    renderWithProvider(<ThemeToggle />);
    expect(screen.getByRole('radio', { name: /amber/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /dark/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /gold/i })).toBeInTheDocument();
  });

  it('highlights active theme', () => {
    localStorage.setItem('budgetbitch:theme', 'dark');
    renderWithProvider(<ThemeToggle />);
    const darkBtn = screen.getByRole('radio', { name: /dark/i });
    expect(darkBtn).toHaveAttribute('data-active', 'true');
  });

  it('changes theme on click', () => {
    renderWithProvider(<ThemeToggle />);
    fireEvent.click(screen.getByRole('radio', { name: /gold/i }));
    expect(document.documentElement.classList.contains('theme-gold')).toBe(true);
  });
});