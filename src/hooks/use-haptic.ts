import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

const patterns: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 40,
  selection: [5, 5, 5],
  success: [10, 50, 10],
  warning: [20, 100, 20],
  error: [30, 30, 30, 30, 30],
};

export function useHaptic() {
  const trigger = useCallback((type: HapticType = 'light') => {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate(patterns[type]);
    } catch {
      // Silently fail if vibration not supported
    }
  }, []);

  return { trigger };
}