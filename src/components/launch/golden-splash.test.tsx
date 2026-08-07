// src/components/launch/golden-splash.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { GoldenSplash } from './golden-splash';

const mockUseReducedMotion = vi.fn().mockReturnValue(false);
vi.mock('framer-motion', async (importOriginal) => {
  const mod = await importOriginal() as Record<string, unknown>;
  return {
    ...mod,
    useReducedMotion: () => mockUseReducedMotion(),
  };
});

describe('GoldenSplash', () => {
  beforeEach(() => {
    mockUseReducedMotion.mockReturnValue(false);
  });

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

  it('mounts a canvas element when motion is allowed', () => {
    render(<GoldenSplash onProceed={vi.fn()} />);
    expect(document.querySelector('canvas')).not.toBeNull();
  });

  it('does not mount canvas when prefers-reduced-motion', () => {
    mockUseReducedMotion.mockReturnValue(true);
    render(<GoldenSplash onProceed={vi.fn()} />);
    expect(document.querySelector('canvas')).toBeNull();
  });

  it('renders background particles with the correct updated keyframe name and low opacity style', () => {
    render(<GoldenSplash onProceed={vi.fn()} />);
    const styleTag = document.querySelector('style');
    expect(styleTag).not.toBeNull();
    expect(styleTag?.textContent).toContain('bb-particle-float-v2');

    // Verify background particles have text-amber-400/5 class
    const particles = screen.getAllByText(/🪙|💵|\$/);
    expect(particles.length).toBeGreaterThan(0);
    expect(particles[0]).toHaveClass('text-amber-400/5');
  });
});


