// src/components/dashboard/budget-tip-skeleton.test.tsx
import { render, screen, act } from '@testing-library/react';
import { BudgetTipSkeleton } from '@/components/dashboard/budget-tip-skeleton';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('BudgetTipSkeleton', () => {
  const tips = ['Tip 1', 'Tip 2', 'Tip 3'];

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders skeleton placeholders with count', () => {
    render(<BudgetTipSkeleton tips={tips} count={2} />);

    const skeletons = screen.getAllByRole('status');
    expect(skeletons.length).toBeGreaterThanOrEqual(2);
  });

  it('shows a budget tip from the tips array', () => {
    render(<BudgetTipSkeleton tips={tips} count={2} />);

    // Should show one of the tips
    const tipText = screen.getByText(/Tip [123]/);
    expect(tipText).toBeInTheDocument();
  });

  it('rotates tips every 3 seconds', () => {
      render(<BudgetTipSkeleton tips={tips} count={2} />);

      // Initial tip should be visible
      expect(screen.getByText('Tip 1')).toBeInTheDocument();

      // Advance timer by 3 seconds - trigger the interval
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Should show next tip
      expect(screen.getByText('Tip 2')).toBeInTheDocument();

      // Advance another 3 seconds
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Should show next tip
      expect(screen.getByText('Tip 3')).toBeInTheDocument();
    });

  it('cleans up interval on unmount', () => {
    const { unmount } = render(<BudgetTipSkeleton tips={tips} count={2} />);
    unmount();

    // Advance timer - should not throw or error
    act(() => {
      vi.advanceTimersByTime(3000);
    });
  });
});