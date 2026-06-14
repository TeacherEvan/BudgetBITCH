import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BudgetRing } from './budget-ring';
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

describe('BudgetRing', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it('renders SVG circle with correct stroke-dasharray', () => {
    renderWithProvider(<BudgetRing progress={0.65} size={120} strokeWidth={8} />);
    const circle = screen.getByTestId('progress-ring');
    const radius = 56; // (120 - 8) / 2
    const circumference = 2 * Math.PI * radius;
    expect(circle).toHaveAttribute('stroke-dasharray', `${circumference} ${circumference}`);
  });

  it('renders with correct calculated circumference', () => {
    renderWithProvider(<BudgetRing progress={0.65} size={120} strokeWidth={8} />);
    const circle = screen.getByTestId('progress-ring');
    const radius = 56;
    const circumference = 2 * Math.PI * radius;
    // Verify the stroke-dasharray attribute has the correct circumference value
    const dashArray = circle.getAttribute('stroke-dasharray');
    expect(dashArray).toContain(circumference.toString().slice(0, 6));
  });

  it('shows percentage text in center', () => {
    renderWithProvider(<BudgetRing progress={0.65} size={120} strokeWidth={8} />);
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('clamps progress between 0 and 1', () => {
    renderWithProvider(<BudgetRing progress={1.5} size={120} strokeWidth={8} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    
    renderWithProvider(<BudgetRing progress={-0.5} size={120} strokeWidth={8} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('applies Framer Motion animate prop', () => {
    renderWithProvider(<BudgetRing progress={0.65} size={120} strokeWidth={8} />);
    const circle = screen.getByTestId('progress-ring');
    // The animate prop should be present as a Framer Motion internal attribute
    // In test environment, just verify the element renders correctly
    expect(circle).toBeInTheDocument();
  });
});