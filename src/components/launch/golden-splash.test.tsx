// src/components/launch/golden-splash.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { GoldenSplash } from './golden-splash';

describe('GoldenSplash', () => {
  it('renders the golden splash screen and calls onProceed when button is clicked', async () => {
    vi.useFakeTimers();
    const handleProceed = vi.fn();

    render(<GoldenSplash onProceed={handleProceed} />);

    expect(screen.getByTestId('golden-splash')).toBeInTheDocument();

    // Fast-forward through animation phases (reckoning -> statement -> invitation -> ready)
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    // Check slogan badge renders
    expect(screen.getByText(/Shut up and do it!!!/i)).toBeInTheDocument();

    // Check Enter button appears and works
    const enterBtn = screen.getByRole('button', { name: /enter boss mode/i });
    expect(enterBtn).toBeInTheDocument();

    act(() => {
      enterBtn.click();
    });

    expect(handleProceed).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
