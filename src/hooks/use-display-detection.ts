// hooks/use-display-detection.ts
'use client';

import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type DeviceOrientation = 'portrait' | 'landscape';

export interface DisplayInfo {
  deviceType: DeviceType;
  orientation: DeviceOrientation;
  isTouch: boolean;
  isStandalone: boolean;
  width: number;
  height: number;
  hasNotch: boolean;
}

export function useDisplayDetection(): DisplayInfo {
  const [displayInfo, setDisplayInfo] = useState<DisplayInfo>({
    deviceType: 'desktop',
    orientation: 'landscape',
    isTouch: false,
    isStandalone: false,
    width: 1280,
    height: 800,
    hasNotch: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateDisplay = () => {
      const width = window.innerWidth || 1280;
      const height = window.innerHeight || 800;
      const isTouch = 'ontouchstart' in window || (navigator && navigator.maxTouchPoints > 0);
      const isStandalone = (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) ||
        (navigator as unknown as { standalone?: boolean })?.standalone === true;

      let deviceType: DeviceType = 'desktop';
      if (width < 640) {
        deviceType = 'mobile';
      } else if (width < 1024) {
        deviceType = 'tablet';
      }

      const orientation: DeviceOrientation = height > width ? 'portrait' : 'landscape';
      const hasNotch = isTouch && (height > 800 && width < 500);

      setDisplayInfo({
        deviceType,
        orientation,
        isTouch,
        isStandalone,
        width,
        height,
        hasNotch,
      });
    };

    updateDisplay();
    window.addEventListener('resize', updateDisplay);
    window.addEventListener('orientationchange', updateDisplay);

    return () => {
      window.removeEventListener('resize', updateDisplay);
      window.removeEventListener('orientationchange', updateDisplay);
    };
  }, []);

  return displayInfo;
}
