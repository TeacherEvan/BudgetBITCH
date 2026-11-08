import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHaptic } from './use-haptic';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

vi.mock('@capacitor/haptics', () => ({
  Haptics: {
    impact: vi.fn(),
    notification: vi.fn(),
    selectionStart: vi.fn(),
    selectionEnd: vi.fn(),
  },
  ImpactStyle: {
    Light: 'LIGHT',
    Medium: 'MEDIUM',
    Heavy: 'HEAVY',
  },
  NotificationType: {
    Success: 'SUCCESS',
    Warning: 'WARNING',
    Error: 'ERROR',
  },
}));

describe('useHaptic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dispatches native Capacitor Haptics impact and notification calls', async () => {
    const { result } = renderHook(() => useHaptic());

    act(() => {
      result.current.trigger('light');
      result.current.trigger('success');
    });

    await vi.waitFor(() => {
      expect(Haptics.impact).toHaveBeenCalledWith({ style: ImpactStyle.Light });
      expect(Haptics.notification).toHaveBeenCalledWith({ type: NotificationType.Success });
    });
  });

  it('falls back to navigator.vibrate when Capacitor Haptics rejects', async () => {
    vi.mocked(Haptics.impact).mockRejectedValueOnce(new Error('Web platform'));
    const vibrateSpy = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateSpy,
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useHaptic());
    act(() => {
      result.current.trigger('medium');
    });

    await vi.waitFor(() => {
      expect(vibrateSpy).toHaveBeenCalledWith(20);
    });
  });

  it('calls navigator.vibrate patterns for all haptic types on standard browser', () => {
    const vibrateSpy = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateSpy,
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useHaptic());

    act(() => {
      result.current.trigger('light');
    });
    expect(vibrateSpy).toHaveBeenCalledWith(10);

    act(() => {
      result.current.trigger('medium');
    });
    expect(vibrateSpy).toHaveBeenCalledWith(20);

    act(() => {
      result.current.trigger('heavy');
    });
    expect(vibrateSpy).toHaveBeenCalledWith(40);

    act(() => {
      result.current.trigger('selection');
    });
    expect(vibrateSpy).toHaveBeenCalledWith([5, 5, 5]);

    act(() => {
      result.current.trigger('success');
    });
    expect(vibrateSpy).toHaveBeenCalledWith([10, 50, 10]);

    act(() => {
      result.current.trigger('warning');
    });
    expect(vibrateSpy).toHaveBeenCalledWith([20, 100, 20]);

    act(() => {
      result.current.trigger('error');
    });
    expect(vibrateSpy).toHaveBeenCalledWith([30, 30, 30, 30, 30]);
  });
});
