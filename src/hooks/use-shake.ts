// hooks/use-shake.ts
'use client';

import { useEffect, useRef } from 'react';

interface UseShakeOptions {
  threshold?: number; // Acceleration threshold (m/s^2)
  timeout?: number;   // Debounce timeout between shake triggers (ms)
  onShake: () => void;
}

export function useShake({ threshold = 15, timeout = 1000, onShake }: UseShakeOptions) {
  const lastShakeTime = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const delta = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
      const now = Date.now();

      if (delta > threshold && now - lastShakeTime.current > timeout) {
        lastShakeTime.current = now;
        onShake();
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [threshold, timeout, onShake]);
}
