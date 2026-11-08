import { useCallback } from 'react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

const patterns: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 40,
  selection: [5, 5, 5],
  success: [10, 50, 10],
  warning: [20, 100, 20],
  error: [30, 30, 30, 30, 30],
};

function fallbackVibrate(type: HapticType) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(patterns[type]);
  } catch {
    // Silently ignore unsupported browser contexts
  }
}

export function useHaptic() {
  const trigger = useCallback((type: HapticType = 'light') => {
    // Synchronously execute web vibration fallback so standard web/browser contexts
    // and synchronous test assertions fire without async lag
    fallbackVibrate(type);

    // Also dispatch to native Capacitor Haptics (iOS Taptic engine & Android actuator)
    void (async () => {
      try {
        switch (type) {
          case 'light':
            await Haptics.impact({ style: ImpactStyle.Light });
            return;
          case 'medium':
            await Haptics.impact({ style: ImpactStyle.Medium });
            return;
          case 'heavy':
            await Haptics.impact({ style: ImpactStyle.Heavy });
            return;
          case 'selection':
            await Haptics.selectionStart();
            await Haptics.selectionEnd();
            return;
          case 'success':
            await Haptics.notification({ type: NotificationType.Success });
            return;
          case 'warning':
            await Haptics.notification({ type: NotificationType.Warning });
            return;
          case 'error':
            await Haptics.notification({ type: NotificationType.Error });
            return;
        }
      } catch {
        // Silently ignore if plugin is unavailable or running outside native shell
      }
    })();
  }, []);

  return { trigger };
}
