import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BentoGrid } from './bento-grid';
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

describe('BentoGrid', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it('renders panels in a responsive grid', () => {
    const mockPanels = [
      { id: 'expenses' as const, title: 'Expenses', children: <div data-testid="expenses">Expenses</div> },
      { id: 'budget' as const, title: 'Budget', children: <div data-testid="budget">Budget</div> },
      { id: 'goals' as const, title: 'Goals', children: <div data-testid="goals">Goals</div> },
    ];
    renderWithProvider(<BentoGrid panels={mockPanels} />);
    const grid = screen.getByTestId('bento-grid');
    expect(grid).toHaveClass('grid');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('sm:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-3');
    expect(grid).toHaveClass('xl:grid-cols-4');
  });

  it('renders each panel in a card', () => {
    const mockPanels = [
      { id: 'expenses' as const, title: 'Expenses', children: <div data-testid="expenses">Expenses</div> },
      { id: 'budget' as const, title: 'Budget', children: <div data-testid="budget">Budget</div> },
      { id: 'goals' as const, title: 'Goals', children: <div data-testid="goals">Goals</div> },
    ];
    renderWithProvider(<BentoGrid panels={mockPanels} />);
    expect(screen.getByTestId('expenses')).toBeInTheDocument();
    expect(screen.getByTestId('budget')).toBeInTheDocument();
    expect(screen.getByTestId('goals')).toBeInTheDocument();
  });

  it('applies staggered animation delays via style', () => {
    const mockPanels = [
      { id: 'expenses' as const, title: 'Expenses', children: <div data-testid="expenses">Expenses</div> },
      { id: 'budget' as const, title: 'Budget', children: <div data-testid="budget">Budget</div> },
      { id: 'goals' as const, title: 'Goals', children: <div data-testid="goals">Goals</div> },
    ];
    renderWithProvider(<BentoGrid panels={mockPanels} />);
    const cards = screen.getAllByTestId('panel-card');
    expect(cards[0]).toHaveStyle({ '--delay': '0ms' });
    expect(cards[1]).toHaveStyle({ '--delay': '100ms' });
    expect(cards[2]).toHaveStyle({ '--delay': '200ms' });
  });
});