import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { useDisplayDetection } from './use-display-detection';

describe('useDisplayDetection', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: originalInnerWidth });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: originalInnerHeight });
  });

  it('detects mobile screen size correctly', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 390 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 844 });

    const { result } = renderHook(() => useDisplayDetection());
    
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.deviceType).toBe('mobile');
    expect(result.current.orientation).toBe('portrait');
    expect(result.current.width).toBe(390);
  });

  it('detects tablet screen size correctly', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 768 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 1024 });

    const { result } = renderHook(() => useDisplayDetection());

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.deviceType).toBe('tablet');
  });

  it('detects desktop screen size correctly', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1440 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 900 });

    const { result } = renderHook(() => useDisplayDetection());

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.deviceType).toBe('desktop');
    expect(result.current.orientation).toBe('landscape');
  });
});
