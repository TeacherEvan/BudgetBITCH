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

  it('renders Thai localized strings when locale is th', () => {
    render(<MoneySyncLoading locale="th" />);

    expect(screen.getByText('กำลังซิงค์กระแสเงิน')).toBeInTheDocument();
    expect(screen.getByText('เงินเข้า (MONEY IN)')).toBeInTheDocument();
    expect(screen.getByText('เงินออก (MONEY OUT)')).toBeInTheDocument();
    expect(screen.getByText('เงินคงเหลือสุทธิ (FUNDS AVAILABLE)')).toBeInTheDocument();
  });

  it('calls onComplete after minimum display duration', () => {
    const onComplete = vi.fn();
    render(<MoneySyncLoading locale="en" onComplete={onComplete} />);

    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not call onComplete before minimum display duration', () => {
    const onComplete = vi.fn();
    render(<MoneySyncLoading locale="en" onComplete={onComplete} />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('cleans up timer on unmount', () => {
    const onComplete = vi.fn();
    const { unmount } = render(<MoneySyncLoading locale="en" onComplete={onComplete} />);

    unmount();

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(onComplete).not.toHaveBeenCalled();
  });
});
