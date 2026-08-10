// src/components/ui/money-sync-loading.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MoneySyncLoading } from './money-sync-loading';

describe('MoneySyncLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders Money In and Money Out section indicators correctly in English', () => {
    render(<MoneySyncLoading locale="en" message="Custom Loading Message" />);

    expect(screen.getByText('MONEY FLOW ENGINE')).toBeInTheDocument();
    expect(screen.getByText('Custom Loading Message')).toBeInTheDocument();
    expect(screen.getByText('MONEY IN')).toBeInTheDocument();
    expect(screen.getByText('MONEY OUT')).toBeInTheDocument();
    expect(screen.getByText('FUNDS AVAILABLE (NET)')).toBeInTheDocument();
  });

  it('renders English UI strings when locale is en', () => {
    render(<MoneySyncLoading locale="en" />);

    expect(screen.getByText('MONEY FLOW ENGINE')).toBeInTheDocument();
    expect(screen.getByText('MONEY IN')).toBeInTheDocument();
    expect(screen.getByText('MONEY OUT')).toBeInTheDocument();
    expect(screen.getByText('FUNDS AVAILABLE (NET)')).toBeInTheDocument();
  });

  it('calls onComplete after minimum display duration (default 5s)', () => {
    const onComplete = vi.fn();
    render(<MoneySyncLoading locale="en" onComplete={onComplete} />);

    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('respects a custom minDurationMs override', () => {
    const onComplete = vi.fn();
    render(<MoneySyncLoading locale="en" minDurationMs={3000} onComplete={onComplete} />);

    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not call onComplete before minimum display duration', () => {
    const onComplete = vi.fn();
    render(<MoneySyncLoading locale="en" onComplete={onComplete} />);

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('cleans up timer on unmount', () => {
    const onComplete = vi.fn();
    const { unmount } = render(<MoneySyncLoading locale="en" onComplete={onComplete} />);

    unmount();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onComplete).not.toHaveBeenCalled();
  });
});
